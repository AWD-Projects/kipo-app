// src/types/twilio.d.ts
declare module "twilio" {
    // Validador de firmas del webhook
    export function validateRequest(
        authToken: string,
        signature: string,
        url: string,
        params: Record<string, any>
    ): boolean;

    // Cliente básico de mensajes que usamos
    export default function twilio(accountSid: string, authToken: string): {
        messages: {
            create(args: { from: string; to: string; body: string }): Promise<any>;
        };
    };
}
