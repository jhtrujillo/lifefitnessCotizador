<?php
header('Content-Type: application/json; charset=utf-8');

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON payload"]);
    exit;
}

// Database Connection
$isLocal = ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1' || strpos($_SERVER['SERVER_NAME'], '192.168.') !== false);

$dbhost = $isLocal ? 'localhost' : 'mysql.advantascience.com';
$dbport = $isLocal ? '8889' : '3306';
$dbuser = $isLocal ? 'root' : 'lifefitnesdb'; 
$dbpass = $isLocal ? 'root' : 'JT-sq16cy21';
$dbname = 'cotizacioneslifefitness';

$conn = new mysqli($dbhost, $dbuser, $dbpass, $dbname, $dbport);

$nombre = trim($input['name'] ?? '');
$empresa = trim($input['company'] ?? '');
$email = trim($input['email'] ?? '');
$telefono = trim($input['phone'] ?? '');
$tipo = trim($input['type'] ?? '');
$mensaje = trim($input['message'] ?? '');
$items = $input['items'] ?? []; // [{ item_no, name, serie, img, qty }]

// Guardar en la base de datos
if (!$conn->connect_error) {
    $stmt = $conn->prepare("INSERT INTO solicitudes_cotizacion (nombre, empresa, email, telefono, json_productos, mensaje) VALUES (?, ?, ?, ?, ?, ?)");
    if ($stmt) {
        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        $fullMensaje = (!empty($tipo) && $tipo !== 'Tipo de equipo / Proyecto' ? "[Proyecto: $tipo] " : "") . $mensaje;
        $stmt->bind_param("ssssss", $nombre, $empresa, $email, $telefono, $itemsJson, $fullMensaje);
        $stmt->execute();
        $stmt->close();
    }
}

// Configuración de destinatarios
$to_administrador = "ventas@advantascience.com"; 
$to_cliente = $email;

$subject_admin = "🔔 Nueva Solicitud de Cotización Web: " . ($nombre ?: 'Cliente Web');
$subject_cliente = "🏋️ Hemos recibido tu solicitud de cotización - Fitness Life S.A.S";

// Construir tabla HTML de productos
$items_count = count($items);
$base_url = "https://advantascience.com/fitnesslife/";

$items_rows = "";
if ($items_count > 0) {
    foreach ($items as $idx => $item) {
        $sku = htmlspecialchars($item['item_no'] ?? 'N/A');
        $pName = htmlspecialchars($item['name'] ?? 'Equipo');
        $pSerie = !empty($item['serie']) ? "<span style='font-size:11px; color:#e63946; font-weight:700;'>[Serie " . htmlspecialchars($item['serie']) . "]</span> " : "";
        $pQty = intval($item['qty'] ?? 1);
        $pImg = $item['img'] ?? '';
        
        $imgTag = "";
        if (!empty($pImg)) {
            $imgUrl = (strpos($pImg, 'http') === 0) ? $pImg : ($base_url . ltrim($pImg, '/'));
            $imgTag = "<img src='$imgUrl' alt='$pName' style='width:52px; height:52px; object-fit:contain; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0; display:block;'>";
        } else {
            $imgTag = "<div style='width:52px; height:52px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:20px;'>🏋️</div>";
        }

        $bgRow = ($idx % 2 === 0) ? "#ffffff" : "#f8fafc";
        $items_rows .= "
        <tr style='background: $bgRow; border-bottom: 1px solid #e2e8f0;'>
            <td style='padding: 12px; text-align: center; width: 60px;'>$imgTag</td>
            <td style='padding: 12px;'>
                <div style='font-weight: 700; color: #1e293b; font-size: 14px;'>$pName</div>
                <div style='font-size: 12px; color: #64748b; margin-top: 2px;'>$pSerie SKU: <strong>$sku</strong></div>
            </td>
            <td style='padding: 12px; text-align: center; font-weight: 700; color: #0f172a; font-size: 15px; width: 80px;'>$pQty</td>
        </tr>";
    }
} else {
    $items_rows = "
    <tr>
        <td colspan='3' style='padding: 24px; text-align: center; color: #64748b; font-style: italic;'>
            El cliente solicitó una asesoría general (no seleccionó equipos individuales del catálogo).
        </td>
    </tr>";
}

$items_table = "
<table style='width: 100%; border-collapse: collapse; margin-top: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-family: Arial, sans-serif;'>
    <thead>
        <tr style='background: #1d3557; color: #ffffff;'>
            <th style='padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase;'>Equipo</th>
            <th style='padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;'>Descripción / SKU</th>
            <th style='padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase;'>Cantidad</th>
        </tr>
    </thead>
    <tbody>
        $items_rows
    </tbody>
</table>";

// Plantilla Base Corporativa
function renderEmailTemplate($title, $headerGreeting, $introMessage, $clientCardHtml, $items_table, $extraHtml = "") {
    return "
    <!DOCTYPE html>
    <html lang='es'>
    <head>
        <meta charset='UTF-8'>
        <title>$title</title>
    </head>
    <body style='margin: 0; padding: 24px; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;'>
        <table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 650px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;'>
            <!-- Cabecera -->
            <tr>
                <td style='background: linear-gradient(135deg, #1d3557 0%, #0d1b2a 100%); padding: 28px 32px; text-align: center; border-bottom: 4px solid #e63946;'>
                    <img src='https://advantascience.com/fitnesslife/assets/logo.png' alt='Fitness Life S.A.S' style='height: 48px; background: white; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-bottom: 12px;'>
                    <h1 style='color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;'>$title</h1>
                </td>
            </tr>

            <!-- Contenido Principal -->
            <tr>
                <td style='padding: 32px;'>
                    <h2 style='color: #1e293b; margin: 0 0 12px; font-size: 18px;'>$headerGreeting</h2>
                    <p style='color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;'>$introMessage</p>

                    <!-- Ficha de Datos del Cliente -->
                    $clientCardHtml

                    <!-- Equipos Solicitados -->
                    <h3 style='color: #1e293b; margin: 24px 0 8px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.03em;'>📦 Equipos Solicitados</h3>
                    $items_table

                    $extraHtml
                </td>
            </tr>

            <!-- Pie de Página -->
            <tr>
                <td style='background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; line-height: 1.5;'>
                    <strong style='color: #1e293b;'>FITNESS LIFE S.A.S</strong> — Importador Directo Autorizado en Colombia<br>
                    📞 PBX / WhatsApp: <a href='https://wa.me/573128011838' style='color: #e63946; text-decoration: none; font-weight: 700;'>+57 (312) 801-1838</a> | +57 (312) 719-9008<br>
                    ✉️ <a href='mailto:ventas@advantascience.com' style='color: #1d3557; text-decoration: none;'>ventas@advantascience.com</a> — Cali, Colombia
                </td>
            </tr>
        </table>
    </body>
    </html>";
}

// Ficha de Datos
$clientCard = "
<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #e63946; border-radius: 8px; padding: 18px; margin-bottom: 24px;'>
    <table style='width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;'>
        <tr>
            <td style='padding: 4px 8px 4px 0; width: 140px; font-weight: 700; color: #64748b;'>👤 Nombre:</td>
            <td style='padding: 4px 0; font-weight: 700; color: #0f172a;'>" . htmlspecialchars($nombre ?: 'No especificado') . "</td>
        </tr>
        " . (!empty($empresa) ? "
        <tr>
            <td style='padding: 4px 8px 4px 0; font-weight: 700; color: #64748b;'>🏢 Empresa / Proyecto:</td>
            <td style='padding: 4px 0;'>" . htmlspecialchars($empresa) . "</td>
        </tr>" : "") . "
        <tr>
            <td style='padding: 4px 8px 4px 0; font-weight: 700; color: #64748b;'>✉️ Correo Electrónico:</td>
            <td style='padding: 4px 0;'><a href='mailto:" . htmlspecialchars($email) . "' style='color: #1d3557; font-weight: 700; text-decoration: none;'>" . htmlspecialchars($email) . "</a></td>
        </tr>
        <tr>
            <td style='padding: 4px 8px 4px 0; font-weight: 700; color: #64748b;'>📞 Teléfono / Celular:</td>
            <td style='padding: 4px 0;'><a href='tel:" . htmlspecialchars($telefono) . "' style='color: #0f172a; text-decoration: none; font-weight: 700;'>" . htmlspecialchars($telefono) . "</a></td>
        </tr>
        " . (!empty($tipo) ? "
        <tr>
            <td style='padding: 4px 8px 4px 0; font-weight: 700; color: #64748b;'>🏋️ Tipo de Interés:</td>
            <td style='padding: 4px 0; font-weight: 600; color: #e63946;'>" . htmlspecialchars($tipo) . "</td>
        </tr>" : "") . "
        " . (!empty($mensaje) ? "
        <tr>
            <td style='padding: 8px 8px 4px 0; font-weight: 700; color: #64748b; vertical-align: top;'>💬 Mensaje:</td>
            <td style='padding: 8px 0; color: #1e293b; line-height: 1.4;'>" . nl2br(htmlspecialchars($mensaje)) . "</td>
        </tr>" : "") . "
    </table>
</div>";

// Cuerpo para el Administrador
$body_admin = renderEmailTemplate(
    "Nueva Solicitud Web de Cotización",
    "¡Has recibido un nuevo lead desde la página web!",
    "Un cliente potencial ha diligenciado el formulario de cotización en <strong>fitnesslifesas.com</strong>. A continuación tienes los datos de contacto y el listado de equipos para atender la solicitud comercial:",
    $clientCard,
    $items_table,
    "<div style='margin-top: 24px; text-align: center;'>
        <a href='https://advantascience.com/fitnesslife/v1/cotizaciones/cotizador.html' style='display: inline-block; background: #e63946; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 13px; text-transform: uppercase;'>Abrir Cotizador Comercial &rarr;</a>
    </div>"
);

// Cuerpo para el Cliente
$body_cliente = renderEmailTemplate(
    "Solicitud de Cotización Recibida",
    "Hola " . htmlspecialchars($nombre) . ",",
    "Muchas gracias por ponerte en contacto con <strong>Fitness Life S.A.S</strong>. Hemos recibido tu solicitud de cotización con éxito y uno de nuestros asesores comerciales especializados se comunicará contigo en breve para brindarte precios, disponibilidad y condiciones de entrega.",
    $clientCard,
    $items_table,
    "<p style='color: #475569; font-size: 13px; line-height: 1.6; margin: 24px 0 0;'>Si requieres atención inmediata o asesoría en la planeación y diseño de tu espacio fitness, también puedes escribirnos directamente por WhatsApp al <a href='https://wa.me/573128011838' style='color: #10b981; font-weight: 700; text-decoration: none;'>+57 (312) 801-1838</a>.</p>"
);

// --- PHPMAILER CON LA MISMA CONFIGURACIÓN DEL COTIZADOR ---
require_once __DIR__ . '/libs/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendNotificationSMTP($to, $subject, $htmlBody, $replyTo = null) {
    if (empty($to)) return false;
    $mail = new PHPMailer(true);
    try {
        $mail->CharSet    = 'UTF-8';
        $mail->isSMTP();
        $mail->Host       = 'smtp.dreamhost.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'ventas@advantascience.com';
        $mail->Password   = 'JTP-sq16cy21';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('ventas@advantascience.com', 'Fitness Life S.A.S');
        $mail->addAddress($to);

        if (!empty($replyTo) && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
            $mail->addReplyTo($replyTo);
        } else {
            $mail->addReplyTo('ventas@advantascience.com', 'Ventas Fitness Life');
        }

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("SMTP Error sending to $to: {$mail->ErrorInfo}");
        file_put_contents(__DIR__ . '/mail_error.log', date('Y-m-d H:i:s') . " SMTP Error ($to): " . $mail->ErrorInfo . "\n", FILE_APPEND);
        return false;
    }
}

// 1. Enviar notificación al Administrador / Ventas (con reply-to al correo del cliente)
sendNotificationSMTP($to_administrador, $subject_admin, $body_admin, $email);

// 2. Enviar copia de confirmación al Cliente
if (!empty($to_cliente) && filter_var($to_cliente, FILTER_VALIDATE_EMAIL)) {
    sendNotificationSMTP($to_cliente, $subject_cliente, $body_cliente);
}

echo json_encode(["success" => true, "msg" => "Cotización procesada y correos enviados"]);
?>
