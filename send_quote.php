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
$dbname = $isLocal ? 'cotizacioneslifefitness' : 'cotizacioneslifefitness';

$conn = new mysqli($dbhost, $dbuser, $dbpass, $dbname, $dbport);

$nombre = $input['name'] ?? '';
$empresa = $input['company'] ?? '';
$email = $input['email'] ?? '';
$telefono = $input['phone'] ?? '';
$tipo = $input['type'] ?? '';
$mensaje = $input['message'] ?? '';
$items = $input['items'] ?? []; // [{ item_no, name, qty }]

if (!$conn->connect_error) {
    $stmt = $conn->prepare("INSERT INTO solicitudes_cotizacion (nombre, empresa, email, telefono, tipo, mensaje, items) VALUES (?, ?, ?, ?, ?, ?, ?)");
    if ($stmt) {
        $itemsJson = json_encode($items);
        $stmt->bind_param("sssssss", $nombre, $empresa, $email, $telefono, $tipo, $mensaje, $itemsJson);
        $stmt->execute();
        $stmt->close();
    }
}

// Prepare Emails
$to_comercial = "ventas@fitnesslife.com.co"; 
$to_cliente = $email;

$subject_comercial = "Nueva Solicitud de Cotización de $nombre";
$subject_cliente = "Tu cotización con Fitness Life está en proceso";





$items_html = "<table style='width:100%; border-collapse: collapse; margin-top: 20px;'>
    <thead>
        <tr style='background: #e6e6e6;'>
            <th style='padding: 10px; border: 1px solid #ccc; text-align: left;'>SKU</th>
            <th style='padding: 10px; border: 1px solid #ccc; text-align: left;'>Producto</th>
            <th style='padding: 10px; border: 1px solid #ccc; text-align: center;'>Cantidad</th>
        </tr>
    </thead>
    <tbody>";

foreach ($items as $item) {
    $items_html .= "<tr>
        <td style='padding: 10px; border: 1px solid #ccc;'>" . htmlspecialchars($item['item_no']) . "</td>
        <td style='padding: 10px; border: 1px solid #ccc;'>" . htmlspecialchars($item['name']) . "</td>
        <td style='padding: 10px; border: 1px solid #ccc; text-align: center; font-weight: bold;'>" . intval($item['qty']) . "</td>
    </tr>";
}
$items_html .= "</tbody></table>";

$body_comercial = "
<h2>Nueva Solicitud de Cotización</h2>
<p><strong>Nombre:</strong> $nombre</p>
<p><strong>Empresa/Proyecto:</strong> $empresa</p>
<p><strong>Email:</strong> $email</p>
<p><strong>Teléfono:</strong> $telefono</p>
<p><strong>Tipo de Gimnasio:</strong> $tipo</p>
<p><strong>Mensaje:</strong><br/>$mensaje</p>
<h3>Equipos Solicitados:</h3>
$items_html
";

$body_cliente = "
<h2>Hola $nombre,</h2>
<p>Hemos recibido tu solicitud de cotización. Un asesor especializado de Fitness Life se pondrá en contacto contigo en las próximas 24 horas hábiles.</p>
<h3>Resumen de tu solicitud:</h3>
$items_html
<br/>
<p>Gracias por confiar en Fitness Life.</p>
";

// --- PHPMAILER SMTP CONFIGURATION ---
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Helper function to send via SMTP
function sendSMTP($to, $subject, $body) {
    $mail = new PHPMailer(true);
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.dreamhost.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'viviocampo@advantascience.com';
        $mail->Password   = 'PON_TU_CONTRASEÑA_AQUI'; // <-- IMPORTANTE: PON AQUÍ TU CONTRASEÑA
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;
        
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom('viviocampo@advantascience.com', 'Fitness Life');
        $mail->addAddress($to);
        $mail->addReplyTo('ventas@fitnesslife.com.co', 'Ventas Fitness Life');

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("SMTP Error: {$mail->ErrorInfo}");
        file_put_contents('mail_error.log', date('Y-m-d H:i:s') . " SMTP Error: " . $mail->ErrorInfo . "\n", FILE_APPEND);
        return false;
    }
}

// Send both emails using SMTP
sendSMTP($to_comercial, $subject_comercial, $body_comercial);
sendSMTP($to_cliente, $subject_cliente, $body_cliente);


echo json_encode(["success" => true, "msg" => "Cotización procesada"]);
?>
