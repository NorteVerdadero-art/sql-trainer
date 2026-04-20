// ============================================================
// WHMCS SCHEMA — Source of truth para generación de ejercicios
// Fiel al esquema estándar de WHMCS 8.x
// ============================================================

export const WHMCS_SCHEMA = {
  tables: [
    {
      name: "tblclients",
      alias: "Clientes",
      description: "Clientes registrados en WHMCS",
      rows_estimate: "~50,000",
      columns: [
        { name: "id",              type: "INT",      pk: true,  note: "ID único del cliente" },
        { name: "firstname",       type: "VARCHAR",  note: "Nombre" },
        { name: "lastname",        type: "VARCHAR",  note: "Apellido" },
        { name: "email",           type: "VARCHAR",  note: "Email único" },
        { name: "companyname",     type: "VARCHAR",  note: "Empresa (opcional)" },
        { name: "country",         type: "CHAR(2)",  note: "ISO 3166 — MX, US, CO, etc." },
        { name: "status",          type: "ENUM",     note: "Active | Inactive | Closed" },
        { name: "credit",          type: "DECIMAL",  note: "Saldo de crédito" },
        { name: "datecreated",     type: "DATE",     note: "Fecha de registro" },
        { name: "lastlogin",       type: "DATETIME", note: "Último acceso al portal" },
        { name: "currency",        type: "INT",      note: "FK → tblcurrencies.id" },
      ]
    },
    {
      name: "tblinvoices",
      alias: "Facturas",
      description: "Facturas generadas a clientes",
      rows_estimate: "~500,000",
      columns: [
        { name: "id",          type: "INT",      pk: true,  note: "ID de factura" },
        { name: "userid",      type: "INT",      fk: "tblclients.id" },
        { name: "date",        type: "DATE",     note: "Fecha de generación" },
        { name: "duedate",     type: "DATE",     note: "Fecha de vencimiento" },
        { name: "datepaid",    type: "DATETIME", note: "Fecha real de pago (NULL si no pagada)" },
        { name: "subtotal",    type: "DECIMAL",  note: "Antes de impuestos" },
        { name: "tax",         type: "DECIMAL",  note: "Impuesto 1" },
        { name: "tax2",        type: "DECIMAL",  note: "Impuesto 2" },
        { name: "total",       type: "DECIMAL",  note: "Total final" },
        { name: "status",      type: "ENUM",     note: "Draft | Unpaid | Paid | Cancelled | Refunded | Collections" },
        { name: "paymentmethod", type: "VARCHAR", note: "Slug del gateway: paypal, stripe, conekta, etc." },
        { name: "notes",       type: "TEXT",     note: "Notas internas" },
      ]
    },
    {
      name: "tblinvoiceitems",
      alias: "Ítems de factura",
      description: "Líneas de detalle de cada factura",
      rows_estimate: "~800,000",
      columns: [
        { name: "id",          type: "INT",     pk: true },
        { name: "invoiceid",   type: "INT",     fk: "tblinvoices.id" },
        { name: "userid",      type: "INT",     fk: "tblclients.id" },
        { name: "type",        type: "VARCHAR", note: "Hosting | Domain | Addon | Other" },
        { name: "relid",       type: "INT",     note: "ID del servicio relacionado" },
        { name: "description", type: "TEXT",    note: "Descripción del ítem" },
        { name: "amount",      type: "DECIMAL", note: "Monto del ítem" },
        { name: "taxed",       type: "TINYINT", note: "1 = aplica impuesto" },
      ]
    },
    {
      name: "tblhosting",
      alias: "Servicios de hosting",
      description: "Servicios de hosting activos y pasados",
      rows_estimate: "~120,000",
      columns: [
        { name: "id",              type: "INT",      pk: true },
        { name: "userid",          type: "INT",      fk: "tblclients.id" },
        { name: "orderid",         type: "INT",      fk: "tblorders.id" },
        { name: "packageid",       type: "INT",      fk: "tblproducts.id" },
        { name: "server",          type: "INT",      note: "FK servidor asignado" },
        { name: "regdate",         type: "DATE",     note: "Fecha de registro del servicio" },
        { name: "nextduedate",     type: "DATE",     note: "Próxima fecha de cobro" },
        { name: "nextinvoicedate", type: "DATE",     note: "Fecha de generación de factura" },
        { name: "domain",          type: "VARCHAR",  note: "Dominio del hosting" },
        { name: "username",        type: "VARCHAR",  note: "Usuario cPanel" },
        { name: "amount",          type: "DECIMAL",  note: "Precio recurrente" },
        { name: "billingcycle",    type: "VARCHAR",  note: "Monthly | Annually | Biennially | etc." },
        { name: "status",          type: "ENUM",     note: "Active | Suspended | Terminated | Cancelled | Pending" },
        { name: "diskusage",       type: "INT",      note: "MB usados" },
        { name: "disklimit",       type: "INT",      note: "MB límite (0 = ilimitado)" },
        { name: "bwusage",         type: "INT",      note: "GB transferencia usada" },
      ]
    },
    {
      name: "tbldomains",
      alias: "Dominios",
      description: "Dominios registrados y transferidos",
      rows_estimate: "~80,000",
      columns: [
        { name: "id",          type: "INT",     pk: true },
        { name: "userid",      type: "INT",     fk: "tblclients.id" },
        { name: "orderid",     type: "INT",     fk: "tblorders.id" },
        { name: "domain",      type: "VARCHAR", note: "FQDN ej: misitio.com" },
        { name: "registrar",   type: "VARCHAR", note: "enom, resellerclub, neubox, etc." },
        { name: "regdate",     type: "DATE",    note: "Fecha de registro" },
        { name: "nextduedate", type: "DATE",    note: "Fecha de renovación" },
        { name: "expirydate",  type: "DATE",    note: "Fecha de expiración real" },
        { name: "status",      type: "ENUM",    note: "Active | Expired | Transferred Away | Cancelled | Pending" },
        { name: "recurringamount", type: "DECIMAL", note: "Precio de renovación" },
        { name: "registrationperiod", type: "INT", note: "Años de registro" },
        { name: "autorenew",   type: "TINYINT", note: "1 = renovación automática" },
      ]
    },
    {
      name: "tblorders",
      alias: "Órdenes",
      description: "Órdenes de compra (pueden tener múltiples servicios)",
      rows_estimate: "~200,000",
      columns: [
        { name: "id",             type: "INT",      pk: true },
        { name: "userid",         type: "INT",      fk: "tblclients.id" },
        { name: "ordernum",       type: "BIGINT",   note: "Número de orden visible al cliente" },
        { name: "date",           type: "DATETIME", note: "Fecha y hora de la orden" },
        { name: "status",         type: "ENUM",     note: "Pending | Active | Fraud | Cancelled" },
        { name: "invoiceid",      type: "INT",      fk: "tblinvoices.id" },
        { name: "amount",         type: "DECIMAL",  note: "Monto total de la orden" },
        { name: "paymentmethod",  type: "VARCHAR",  note: "Gateway usado" },
        { name: "ipaddress",      type: "VARCHAR",  note: "IP de quien ordenó" },
        { name: "fraudmodule",    type: "VARCHAR",  note: "Módulo antifraude (si aplica)" },
        { name: "fraudoutput",    type: "TEXT",     note: "Resultado del análisis antifraude" },
        { name: "promocode",      type: "VARCHAR",  note: "Código de descuento aplicado" },
        { name: "promotype",      type: "VARCHAR",  note: "Tipo de descuento" },
        { name: "promovalue",     type: "DECIMAL",  note: "Valor del descuento" },
      ]
    },
    {
      name: "tblproducts",
      alias: "Productos",
      description: "Catálogo de productos y planes",
      rows_estimate: "~200",
      columns: [
        { name: "id",          type: "INT",     pk: true },
        { name: "gid",         type: "INT",     note: "FK grupo de productos" },
        { name: "type",        type: "ENUM",    note: "hostingaccount | reselleraccount | server | other" },
        { name: "name",        type: "VARCHAR", note: "Nombre del plan ej: Hosting Start" },
        { name: "description", type: "TEXT",    note: "Descripción del producto" },
        { name: "hidden",      type: "TINYINT", note: "0 = visible en orden" },
        { name: "pricing",     type: "TEXT",    note: "JSON de precios por ciclo y moneda" },
      ]
    },
    {
      name: "tbltickets",
      alias: "Tickets de soporte",
      description: "Tickets del sistema de soporte",
      rows_estimate: "~300,000",
      columns: [
        { name: "id",          type: "INT",      pk: true },
        { name: "did",         type: "INT",      note: "FK departamento" },
        { name: "userid",      type: "INT",      fk: "tblclients.id" },
        { name: "date",        type: "DATETIME", note: "Fecha de apertura" },
        { name: "title",       type: "VARCHAR",  note: "Asunto del ticket" },
        { name: "status",      type: "ENUM",     note: "Open | Answered | Customer-Reply | On Hold | In Progress | Closed" },
        { name: "urgency",     type: "ENUM",     note: "Low | Medium | High" },
        { name: "lastreply",   type: "DATETIME", note: "Fecha de última respuesta" },
        { name: "admin",       type: "VARCHAR",  note: "Admin asignado" },
        { name: "service",     type: "INT",      note: "Servicio relacionado (opcional)" },
      ]
    },
  ],

  // Valores típicos por columna — usados en WHERE del sistema de generación
  enum_values: {
    "tblinvoices.status":  ["Paid", "Unpaid", "Cancelled", "Refunded", "Collections"],
    "tblinvoices.paymentmethod": ["paypal", "stripe", "conekta", "oxxo", "transferencia", "credit"],
    "tblhosting.status":   ["Active", "Suspended", "Terminated", "Cancelled", "Pending"],
    "tblhosting.billingcycle": ["Monthly", "Quarterly", "Semi-Annually", "Annually", "Biennially"],
    "tbldomains.status":   ["Active", "Expired", "Cancelled", "Pending"],
    "tblclients.status":   ["Active", "Inactive", "Closed"],
    "tblorders.status":    ["Active", "Pending", "Fraud", "Cancelled"],
    "tbltickets.status":   ["Open", "Answered", "Closed", "On Hold"],
    "tbltickets.urgency":  ["Low", "Medium", "High"],
    "tblinvoiceitems.type": ["Hosting", "Domain", "Addon", "Other"],
  },

  // Relaciones para ejercicios de JOIN
  relationships: [
    { from: "tblinvoices.userid",    to: "tblclients.id",    label: "Factura → Cliente" },
    { from: "tblhosting.userid",     to: "tblclients.id",    label: "Hosting → Cliente" },
    { from: "tbldomains.userid",     to: "tblclients.id",    label: "Dominio → Cliente" },
    { from: "tblorders.userid",      to: "tblclients.id",    label: "Orden → Cliente" },
    { from: "tbltickets.userid",     to: "tblclients.id",    label: "Ticket → Cliente" },
    { from: "tblinvoiceitems.invoiceid", to: "tblinvoices.id", label: "Ítem → Factura" },
    { from: "tblhosting.orderid",    to: "tblorders.id",     label: "Hosting → Orden" },
    { from: "tblhosting.packageid",  to: "tblproducts.id",   label: "Hosting → Producto" },
    { from: "tblorders.invoiceid",   to: "tblinvoices.id",   label: "Orden → Factura" },
  ]
};

// ============================================================
// CATÁLOGO DE PRODUCTOS — Valores reales en tblproducts
// ============================================================
export const PRODUCT_CATALOG = {
  groups: [
    {
      name: "Hosting Web", gid: 1,
      plans: [
        { id: 10, name: "Hosting Starter",    price_mo: 59,   price_yr: 590,   desc: "1 sitio, 10GB SSD, 5 cuentas correo" },
        { id: 11, name: "Hosting Business",   price_mo: 99,   price_yr: 990,   desc: "5 sitios, 50GB SSD, correos ilimitados" },
        { id: 12, name: "Hosting Pro",        price_mo: 159,  price_yr: 1590,  desc: "Ilimitados, 100GB SSD, soporte 24/7" },
        { id: 13, name: "Hosting Enterprise", price_mo: 299,  price_yr: 2990,  desc: "Ilimitados, 200GB SSD, IP dedicada, prioritario" },
      ]
    },
    {
      name: "Correo Empresarial", gid: 2,
      plans: [
        { id: 20, name: "Correo Starter",    price_mo: 29,  price_yr: 290,  desc: "5 cuentas, 5GB/cuenta" },
        { id: 21, name: "Correo Business",   price_mo: 59,  price_yr: 590,  desc: "25 cuentas, 25GB/cuenta, antispam avanzado" },
        { id: 22, name: "Correo Pro",        price_mo: 99,  price_yr: 990,  desc: "Ilimitadas, 50GB/cuenta, archivado" },
        { id: 23, name: "Correo Enterprise", price_mo: 199, price_yr: 1990, desc: "Ilimitadas, 100GB/cuenta, GDPR" },
      ]
    },
    {
      name: "Certificados SSL", gid: 3,
      plans: [
        { id: 30, name: "SSL DV",       price_mo: null, price_yr: 199,  desc: "Validación dominio, 1 dominio, 2048-bit" },
        { id: 31, name: "SSL OV",       price_mo: null, price_yr: 499,  desc: "Validación organización, green bar" },
        { id: 32, name: "SSL Wildcard", price_mo: null, price_yr: 799,  desc: "Dominio + subdominios ilimitados" },
        { id: 33, name: "SSL EV",       price_mo: null, price_yr: 1499, desc: "Validación extendida, máxima confianza" },
      ]
    },
    {
      name: "Website Builder", gid: 4,
      plans: [
        { id: 40, name: "Builder Básico",   price_mo: 79,  price_yr: 790,  desc: "1 sitio, 50 templates, SEO básico" },
        { id: 41, name: "Builder Pro",      price_mo: 149, price_yr: 1490, desc: "5 sitios, e-commerce hasta 100 productos" },
        { id: 42, name: "Builder Business", price_mo: 249, price_yr: 2490, desc: "Ilimitados, e-commerce sin límite, blog, SEO avanzado" },
      ]
    },
    {
      name: "VPS", gid: 5,
      plans: [
        { id: 50, name: "VPS Nano",       price_mo: 299,  price_yr: 2990,  desc: "1 vCPU · 2GB RAM · 40GB SSD NVMe" },
        { id: 51, name: "VPS Start",      price_mo: 499,  price_yr: 4990,  desc: "2 vCPU · 4GB RAM · 80GB SSD NVMe" },
        { id: 52, name: "VPS Pro",        price_mo: 999,  price_yr: 9990,  desc: "4 vCPU · 8GB RAM · 160GB SSD NVMe" },
        { id: 53, name: "VPS Enterprise", price_mo: 1999, price_yr: 19990, desc: "8 vCPU · 16GB RAM · 320GB NVMe · IP dedicada" },
      ]
    },
    {
      name: "Servicios Gestionados", gid: 6,
      plans: [
        { id: 60, name: "n8n Starter",    price_mo: 199, price_yr: 1990, desc: "1,000 ejecuciones/mes · 5 workflows" },
        { id: 61, name: "n8n Business",   price_mo: 399, price_yr: 3990, desc: "10,000 ejecuciones/mes · workflows ilimitados" },
        { id: 62, name: "n8n Pro",        price_mo: 799, price_yr: 7990, desc: "Ejecuciones ilimitadas · SLA 99.9%" },
        { id: 63, name: "Monitoring Pro", price_mo: 149, price_yr: 1490, desc: "Monitoreo 24/7 · alertas SMS/email · uptime reports" },
      ]
    },
  ]
};

export const PRODUCTS_CONTEXT = PRODUCT_CATALOG.groups.map(g =>
  `[${g.name} — gid=${g.gid}]\n` +
  g.plans.map(p =>
    `  id=${p.id} | "${p.name}" | MXN ${p.price_mo ? `$${p.price_mo}/mes` : '—'} / $${p.price_yr}/año | ${p.desc}`
  ).join('\n')
).join('\n\n');

// Contexto de negocio para el sistema de prompts
export const BUSINESS_CONTEXT = `
Eres un generador de ejercicios SQL para un analista de Business Intelligence en Neubox,
empresa de hosting web en México. El analista trabaja diariamente con la base de datos WHMCS 8.x.
Sus análisis típicos incluyen:
- Ingresos por gateway de pago (PayPal, Stripe, Conekta, OXXO)
- Churn de clientes y servicios (hosting cancelado, dominios expirados)
- Cohortes de clientes por fecha de registro
- Análisis de ticket de soporte por urgencia y tiempo de respuesta
- Productos más vendidos y su recurrencia de pago
- Clientes con múltiples servicios (upsell)
- Facturas vencidas vs cobradas (colecciones)
- Uso de disco y ancho de banda de servidores
Los nombres de tabla siguen el prefijo tbl de WHMCS estándar.
Siempre usa nombres de columna reales del schema proporcionado.
`;
