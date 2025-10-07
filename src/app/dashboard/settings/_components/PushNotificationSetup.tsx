"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;

export default function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setHasSubscription(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        toast.error("Permisos denegados: Necesitas habilitar las notificaciones en tu navegador.");
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Save subscription to database
      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
        auth_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
        user_agent: navigator.userAgent,
        browser: getBrowser(),
        os: getOS(),
      });

      if (error) throw error;

      setHasSubscription(true);
      toast.success("Notificaciones Push activadas: Ahora recibirás recordatorios de pago en este dispositivo.");
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Error al activar notificaciones push: No se pudo completar la suscripción.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);

        setHasSubscription(false);
        toast.success("Notificaciones Push desactivadas: Ya no recibirás notificaciones en este dispositivo.");
      }
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      toast.error("Error al desactivar notificaciones push.");
    } finally {
      setLoading(false);
    }
  };

  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown";
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS")) return "iOS";
    return "Unknown";
  };

  // Don't render anything until mounted (prevents hydration errors)
  if (!mounted) {
    return null;
  }

  if (!("Notification" in window)) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        Tu navegador no soporta notificaciones push
      </div>
    );
  }

  if (hasSubscription) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Push notifications habilitadas en este dispositivo</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribeFromPush}
          disabled={loading}
        >
          Desactivar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Habilita las notificaciones push para recibir recordatorios en este dispositivo
      </p>
      <Button
        onClick={subscribeToPush}
        disabled={loading}
        size="sm"
      >
        <Bell className="h-4 w-4 mr-2" />
        Habilitar Push
      </Button>
    </div>
  );
}
