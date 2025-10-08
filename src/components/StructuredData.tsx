import Script from 'next/script';

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kipo",
    "alternateName": "Kipo App",
    "url": "https://kipo.app",
    "logo": "https://kipo.app/logo.png",
    "description": "App de finanzas personales con integración de WhatsApp e inteligencia artificial para México",
    "foundingDate": "2024",
    "foundingLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "MX"
      }
    },
    "sameAs": [
      "https://twitter.com/kipo_app",
      "https://instagram.com/kipo_app"
    ]
  };

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Kipo - Finanzas Personales",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "MXN"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "Gestiona tus finanzas personales con Kipo. Registra gastos por WhatsApp, recibe recordatorios automáticos de pagos y evita intereses. App web progresiva gratuita.",
    "featureList": [
      "Registro de gastos por WhatsApp",
      "Recordatorios automáticos de pagos de tarjetas",
      "Dashboard financiero en tiempo real",
      "Integración con iOS Shortcuts y Siri",
      "Categorización automática con IA",
      "Notificaciones push",
      "Funciona sin conexión (PWA)"
    ],
    "screenshot": "https://kipo.app/screenshot.png",
    "softwareVersion": "2.0",
    "author": {
      "@type": "Organization",
      "name": "Amoxtli Web Developers"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Kipo es gratis?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, Kipo es 100% gratis con todas las funciones básicas incluidas: transacciones ilimitadas, WhatsApp ilimitado, hasta 5 tarjetas, recordatorios de pagos y notificaciones push."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo funciona la integración con WhatsApp?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Conecta tu número de WhatsApp en la configuración de Kipo y envía mensajes como 'gasté 120 café' para registrar gastos automáticamente. Nuestra IA procesa el mensaje y categoriza la transacción."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo evitar pagar intereses con Kipo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, Kipo te envía recordatorios automáticos por email y notificación push antes de que venzan tus tarjetas de crédito. Configura cuántos días antes quieres el recordatorio. Usuarios ahorran $800/año en promedio."
        }
      },
      {
        "@type": "Question",
        "name": "¿Necesito descargar una app?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No necesitas ir a una tienda de apps. Kipo es una Progressive Web App (PWA) que puedes instalar directamente desde el navegador en iOS, Android o computadora. Funciona offline y se siente como una app nativa."
        }
      },
      {
        "@type": "Question",
        "name": "¿Es seguro Kipo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, Kipo usa encriptación HTTPS/TLS, autenticación segura, Row Level Security en la base de datos y cumple con estándares GDPR. Solo tú tienes acceso a tus datos financieros."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://kipo.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Dashboard",
        "item": "https://kipo.app/dashboard"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Documentación",
        "item": "https://kipo.app/docs"
      }
    ]
  };

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="web-application-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
