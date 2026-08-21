<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// =========================================================================
// CONFIGURACIÓN DE BASE DE DATOS (Elige cuál usar cambiando $entorno)
// =========================================================================
$entorno = ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1' || strpos($_SERVER['SERVER_NAME'], '.local') !== false) ? 'LOCAL' : 'PRODUCCION';

if ($entorno === "LOCAL") {
    // Datos de tu MAMP
    $host = "127.0.0.1";
    $port = "8889";
    $dbname = "fitness_life";
    $username = "root";
    $password = "root";
} else {
    // Datos de tu DreamHost (Producción)
    $host = "mysql.advantascience.com";
    $port = "3306";
    $dbname = "cotizacioneslifefitness";
    $username = "lifefitnesdb";
    $password = "JT-sq16cy21"; // <-- ¡IMPORTANTE! Reemplaza esto con la contraseña que le pusiste al usuario
}

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Asegurarse de que la tabla de cotizaciones exista
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quote_no VARCHAR(50) NOT NULL,
            cliente_id INT NULL,
            cliente_json TEXT,
            items_json TEXT,
            subtotal DECIMAL(12,2),
            iva DECIMAL(12,2),
            total DECIMAL(12,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Asegurarse de que la tabla de clientes exista
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS clientes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            identificacion VARCHAR(50) NOT NULL UNIQUE,
            direccion VARCHAR(255),
            telefono VARCHAR(50),
            email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Asegurarse de que la columna media_json exista en la tabla productos
    try {
        $pdo->exec("ALTER TABLE productos ADD COLUMN media_json TEXT NULL");
    } catch (PDOException $e) {
        // Ignorar si la columna ya existe
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'get_clients') {
    try {
        $stmt = $pdo->query("SELECT * FROM clientes ORDER BY nombre ASC");
        $clients = $stmt->fetchAll();
        echo json_encode(["success" => true, "clients" => $clients]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} 
elseif ($action === 'create_client') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || empty($input['nombre']) || empty($input['identificacion'])) {
            echo json_encode(["success" => false, "error" => "Nombre e identificación son requeridos."]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO clientes (nombre, identificacion, direccion, telefono, email) VALUES (:nombre, :identificacion, :direccion, :telefono, :email)");
        $stmt->execute([
            ':nombre' => $input['nombre'],
            ':identificacion' => $input['identificacion'],
            ':direccion' => $input['direccion'] ?? '',
            ':telefono' => $input['telefono'] ?? '',
            ':email' => $input['email'] ?? ''
        ]);

        $newId = $pdo->lastInsertId();
        $client = [
            'id' => $newId,
            'nombre' => $input['nombre'],
            'identificacion' => $input['identificacion'],
            'direccion' => $input['direccion'] ?? '',
            'telefono' => $input['telefono'] ?? '',
            'email' => $input['email'] ?? ''
        ];

        echo json_encode(["success" => true, "client" => $client]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(["success" => false, "error" => "Ya existe un cliente con esta identificación."]);
        } else {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'get_quotes') {
    try {
        $stmt = $pdo->query("SELECT * FROM cotizaciones ORDER BY updated_at DESC");
        $quotes = $stmt->fetchAll();
        // decodificar jsons para comodidad en JS
        foreach($quotes as &$q) {
            $q['cliente_json'] = json_decode($q['cliente_json'], true);
            $q['items_json'] = json_decode($q['items_json'], true);
        }
        echo json_encode(["success" => true, "quotes" => $quotes]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'save_quote') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $id = $input['id'] ?? null;
        $quote_no = $input['quote_no'] ?? 'S/N';
        $cliente_json = json_encode($input['cliente_json'] ?? []);
        $items_json = json_encode($input['items_json'] ?? []);
        $subtotal = $input['subtotal'] ?? 0;
        $iva = $input['iva'] ?? 0;
        $total = $input['total'] ?? 0;

        if ($id) {
            // update
            $stmt = $pdo->prepare("UPDATE cotizaciones SET quote_no = ?, cliente_json = ?, items_json = ?, subtotal = ?, iva = ?, total = ? WHERE id = ?");
            $stmt->execute([$quote_no, $cliente_json, $items_json, $subtotal, $iva, $total, $id]);
            $inserted_id = $id;
        } else {
            // insert
            $stmt = $pdo->prepare("INSERT INTO cotizaciones (quote_no, cliente_json, items_json, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$quote_no, $cliente_json, $items_json, $subtotal, $iva, $total]);
            $inserted_id = $pdo->lastInsertId();
        }

        echo json_encode(["success" => true, "id" => $inserted_id]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'delete_quote') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        if (!$id) {
            echo json_encode(["success" => false, "error" => "ID requerido"]);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM cotizaciones WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'get_next_quote_no') {
    try {
        $stmt = $pdo->query("SELECT MAX(id) as max_id FROM cotizaciones");
        $row = $stmt->fetch();
        $nextId = ($row['max_id'] ?? 0) + 1;
        $datePart = date('ymd');
        $sequence = str_pad($nextId, 3, '0', STR_PAD_LEFT);
        $quoteNo = "FL-{$datePart}-{$sequence}";
        echo json_encode(["success" => true, "quote_no" => $quoteNo]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'get_products') {
    try {
        $stmt = $pdo->query("SELECT * FROM productos ORDER BY series, pos");
        $productos = $stmt->fetchAll();
        foreach($productos as &$p) {
            $p['media_json'] = (array_key_exists('media_json', $p) && !empty($p['media_json'])) ? json_decode($p['media_json'], true) : [];
        }
        echo json_encode(["success" => true, "productos" => $productos]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'create_product') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO productos (series, item_no, name, price, set_up_dimension, nw, gw, volume, img, media_json, pos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['series'] ?? '',
            $input['item_no'] ?? '',
            $input['name'] ?? '',
            $input['price'] ?? 0,
            $input['set_up_dimension'] ?? '',
            $input['nw'] ?? '',
            $input['gw'] ?? '',
            $input['volume'] ?? '',
            $input['img'] ?? '',
            isset($input['media_json']) ? json_encode($input['media_json']) : '[]',
            $input['pos'] ?? 0
        ]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'update_product') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) throw new Exception("ID requerido");
        
        $stmt = $pdo->prepare("UPDATE productos SET series=?, item_no=?, name=?, price=?, set_up_dimension=?, nw=?, gw=?, volume=?, img=?, media_json=?, pos=? WHERE id=?");
        $stmt->execute([
            $input['series'] ?? '',
            $input['item_no'] ?? '',
            $input['name'] ?? '',
            $input['price'] ?? 0,
            $input['set_up_dimension'] ?? '',
            $input['nw'] ?? '',
            $input['gw'] ?? '',
            $input['volume'] ?? '',
            $input['img'] ?? '',
            isset($input['media_json']) ? json_encode($input['media_json']) : '[]',
            $input['pos'] ?? 0,
            $input['id']
        ]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'delete_product') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) throw new Exception("ID requerido");
        $stmt = $pdo->prepare("DELETE FROM productos WHERE id = ?");
        $stmt->execute([$input['id']]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'upload_product_image') {
    try {
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Error al subir la imagen.");
        }
        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'])) {
            throw new Exception("Formato de archivo no permitido.");
        }
        
        $uploadDir = __DIR__ . '/uploads/productos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $filename = uniqid('prod_') . '.' . $ext;
        $targetFile = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
            throw new Exception("No se pudo guardar el archivo en el servidor.");
        }
        
        $imgPath = 'uploads/productos/' . $filename;
        $type = in_array($ext, ['mp4', 'webm', 'mov']) ? 'video' : 'image';
        
        echo json_encode(["success" => true, "img" => $imgPath, "type" => $type]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'send_email') {
    require 'libs/PHPMailer/Exception.php';
    require 'libs/PHPMailer/PHPMailer.php';
    require 'libs/PHPMailer/SMTP.php';

    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $to_email = $input['to'] ?? null;
        $subject = $input['subject'] ?? 'Cotización Fitness Life';
        $body = $input['body'] ?? '';
        $pdf_base64 = $input['pdf'] ?? null;
        $filename = $input['filename'] ?? 'Cotizacion.pdf';

        if (!$to_email || !$pdf_base64) {
            echo json_encode(["success" => false, "error" => "Faltan datos obligatorios (email o PDF)."]);
            exit;
        }

        if (strpos($pdf_base64, ',') !== false) {
            $pdf_data = base64_decode(explode(',', $pdf_base64)[1]);
        } else {
            $pdf_data = base64_decode($pdf_base64);
        }

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        $mail->CharSet = 'UTF-8';
        $mail->isSMTP();
        $mail->Host       = 'smtp.dreamhost.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'ventas@advantascience.com';
        $mail->Password   = 'JTP-sq16cy21';
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('ventas@advantascience.com', 'Fitness Life S.A.S');
        $mail->addAddress($to_email);

        $mail->addStringAttachment($pdf_data, $filename, 'base64', 'application/pdf');

        $mail->isHTML(true);
        $mail->Subject = $subject;
        
        // Convertir los saltos de línea a <br> y poner el enlace como etiqueta <a>
        // Primero, escapamos el HTML para seguridad
        $htmlBody = htmlspecialchars($body);
        // Convertir URLs a enlaces HTML primero
        $htmlBody = preg_replace('/(https?:\/\/[^\s<]+)/', '<a href="$1" target="_blank">$1</a>', $htmlBody);
        
        // Luego convertir los saltos de línea a <br>
        $htmlBody = nl2br($htmlBody);
        
        $mail->Body    = "<div style='font-family: Arial, sans-serif; color: #333; line-height: 1.5; font-size: 14px;'>$htmlBody</div>";
        $mail->AltBody = $body;

        $mail->send();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $errorMsg = isset($mail) ? $mail->ErrorInfo : $e->getMessage();
        echo json_encode(["success" => false, "error" => "Error SMTP: " . $errorMsg]);
    }
}
else {
    echo json_encode(["success" => false, "error" => "Acción no válida."]);
}
