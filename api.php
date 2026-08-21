<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// =========================================================================
// CONFIGURACIÓN DE BASE DE DATOS
// =========================================================================
$entorno = ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1' || strpos($_SERVER['SERVER_NAME'], '.local') !== false) ? 'LOCAL' : 'PRODUCCION';

if ($entorno === "LOCAL") {
    $host = "127.0.0.1";
    $port = "8889";
    $dbname = "fitness_life";
    $username = "root";
    $password = "root";
} else {
    $host = "mysql.advantascience.com";
    $port = "3306";
    $dbname = "cotizacioneslifefitness";
    $username = "lifefitnesdb";
    $password = "JT-sq16cy21";
}

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Tabla Usuarios
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            rol ENUM('admin', 'comercial') NOT NULL,
            token VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Insertar admin por defecto si no hay usuarios
    $stmt = $pdo->query("SELECT COUNT(*) FROM usuarios");
    if ($stmt->fetchColumn() == 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO usuarios (username, password, nombre, rol) VALUES ('admin', '$hash', 'Administrador Principal', 'admin')");
    }

    // Tabla Cotizaciones
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cotizaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quote_no VARCHAR(50) NOT NULL,
            usuario_id INT NULL,
            cliente_id INT NULL,
            cliente_json TEXT,
            items_json TEXT,
            subtotal DECIMAL(12,2),
            iva DECIMAL(12,2),
            total DECIMAL(12,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ");

    // Intentar agregar usuario_id si la tabla ya existía pero no tenía la columna
    try {
        $pdo->exec("ALTER TABLE cotizaciones ADD COLUMN usuario_id INT NULL, ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL");
    } catch (PDOException $e) { }

    // Tabla Clientes
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

    // Columna media_json en productos
    try {
        $pdo->exec("ALTER TABLE productos ADD COLUMN media_json TEXT NULL");
    } catch (PDOException $e) { }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

// Helper: Obtener usuario autenticado
function get_current_user_obj($pdo) {
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = trim($headers['Authorization']);
        } elseif (isset($headers['authorization'])) {
            $authHeader = trim($headers['authorization']);
        }
    }

    $token = '';
    if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
    } elseif (isset($_GET['token'])) {
        $token = $_GET['token'];
    }

    if (!$token) {
        return null;
    }
    $stmt = $pdo->prepare("SELECT id, username, nombre, rol FROM usuarios WHERE token = ?");
    $stmt->execute([$token]);
    return $stmt->fetch();
}

function require_auth($pdo) {
    $user = get_current_user_obj($pdo);
    if (!$user) {
        echo json_encode(["success" => false, "error" => "No autorizado. Inicie sesión nuevamente.", "auth_failed" => true]);
        exit;
    }
    return $user;
}

function require_admin($pdo) {
    $user = require_auth($pdo);
    if ($user['rol'] !== 'admin') {
        echo json_encode(["success" => false, "error" => "Acceso denegado. Se requieren permisos de administrador."]);
        exit;
    }
    return $user;
}

$action = $_GET['action'] ?? '';

// ==========================================================
// AUTENTICACIÓN Y GESTIÓN DE USUARIOS
// ==========================================================
if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Self-heal: Si el usuario es 'admin' pero su rol se corrompió, forzar a 'admin'
        if (strtolower($user['username']) === 'admin' && $user['rol'] !== 'admin') {
            $pdo->prepare("UPDATE usuarios SET rol = 'admin' WHERE id = ?")->execute([$user['id']]);
            $user['rol'] = 'admin';
        }

        // Reusar el token si ya existe para que no desconecte otros dispositivos
        $token = $user['token'];
        if (empty($token)) {
            $token = bin2hex(random_bytes(32));
            $pdo->prepare("UPDATE usuarios SET token = ? WHERE id = ?")->execute([$token, $user['id']]);
        }
        
        echo json_encode([
            "success" => true, 
            "token" => $token, 
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "nombre" => $user['nombre'],
                "rol" => $user['rol']
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos."]);
    }
}
elseif ($action === 'logout') {
    // Solo respondemos éxito. El frontend limpiará el localStorage.
    // No borramos el token de la BD para no desconectar a otros usuarios que usen la misma cuenta.
    echo json_encode(["success" => true]);
}
elseif ($action === 'get_users') {
    $user = require_auth($pdo);
    // TEMPORAL: Permitir a todos ver usuarios para recuperación
    $stmt = $pdo->query("SELECT id, username, nombre, rol, created_at FROM usuarios ORDER BY nombre ASC");
    echo json_encode(["success" => true, "users" => $stmt->fetchAll()]);
}
elseif ($action === 'create_user') {
    $user = require_auth($pdo);
    // TEMPORAL: Permitir a todos crear usuarios para recuperación
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['username']) || !isset($input['password'])) {
        echo json_encode(["success" => false, "error" => "Datos incompletos."]);
        exit;
    }
    
    try {
        $hash = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)");
        $stmt->execute([$input['username'], $hash, $input['nombre'], $input['rol']]);
        echo json_encode(["success" => true]);
    } catch(PDOException $e) {
        echo json_encode(["success" => false, "error" => "El nombre de usuario ya existe."]);
    }
}
elseif ($action === 'update_user') {
    $user = require_auth($pdo);
    // TEMPORAL: Permitir a todos actualizar usuarios para recuperación
    $input = json_decode(file_get_contents('php://input'), true);
    try {
        if (!empty($input['password'])) {
            $hash = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE usuarios SET username = ?, password = ?, nombre = ?, rol = ? WHERE id = ?");
            $stmt->execute([$input['username'], $hash, $input['nombre'], $input['rol'], $input['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE usuarios SET username = ?, nombre = ?, rol = ? WHERE id = ?");
            $stmt->execute([$input['username'], $input['nombre'], $input['rol'], $input['id']]);
        }
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'delete_user') {
    $user = require_auth($pdo);
    $input = json_decode(file_get_contents('php://input'), true);
    try {
        if ($input['id'] == 1) throw new Exception("No puedes eliminar al administrador principal.");
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$input['id']]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}

// ==========================================================
// CLIENTES Y PRODUCTOS
// ==========================================================
elseif ($action === 'get_clients') {
    require_auth($pdo);
    try {
        $stmt = $pdo->query("SELECT * FROM clientes ORDER BY nombre ASC");
        $clients = $stmt->fetchAll();
        echo json_encode(["success" => true, "clients" => $clients]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} 
elseif ($action === 'create_client') {
    require_auth($pdo);
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
elseif ($action === 'get_products') {
    require_auth($pdo);
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
    $user = require_auth($pdo);
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO productos (series, item_no, name, price, set_up_dimension, nw, gw, volume, img, media_json, pos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['series'] ?? '', $input['item_no'] ?? '', $input['name'] ?? '', $input['price'] ?? 0,
            $input['set_up_dimension'] ?? '', $input['nw'] ?? '', $input['gw'] ?? '', $input['volume'] ?? '',
            $input['img'] ?? '', isset($input['media_json']) ? json_encode($input['media_json']) : '[]', $input['pos'] ?? 0
        ]);
        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'update_product') {
    $user = require_auth($pdo);
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id'])) throw new Exception("ID requerido");
        $stmt = $pdo->prepare("UPDATE productos SET series=?, item_no=?, name=?, price=?, set_up_dimension=?, nw=?, gw=?, volume=?, img=?, media_json=?, pos=? WHERE id=?");
        $stmt->execute([
            $input['series'] ?? '', $input['item_no'] ?? '', $input['name'] ?? '', $input['price'] ?? 0,
            $input['set_up_dimension'] ?? '', $input['nw'] ?? '', $input['gw'] ?? '', $input['volume'] ?? '',
            $input['img'] ?? '', isset($input['media_json']) ? json_encode($input['media_json']) : '[]',
            $input['pos'] ?? 0, $input['id']
        ]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'delete_product') {
    $user = require_auth($pdo);
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
    $user = require_auth($pdo);
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
        if (!is_dir($uploadDir)) { mkdir($uploadDir, 0777, true); }
        
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

// ==========================================================
// COTIZACIONES
// ==========================================================
elseif ($action === 'get_quotes') {
    $user = require_auth($pdo);
    try {
        if ($user['rol'] === 'admin') {
            $stmt = $pdo->query("SELECT * FROM cotizaciones ORDER BY updated_at DESC");
        } else {
            $stmt = $pdo->prepare("SELECT * FROM cotizaciones WHERE usuario_id = ? ORDER BY updated_at DESC");
            $stmt->execute([$user['id']]);
        }
        $quotes = $stmt->fetchAll();
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
    $user = require_auth($pdo);
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
            // Verificar pertenencia si es comercial
            if ($user['rol'] !== 'admin') {
                $check = $pdo->prepare("SELECT usuario_id FROM cotizaciones WHERE id = ?");
                $check->execute([$id]);
                $owner = $check->fetchColumn();
                if ($owner != $user['id']) {
                    throw new Exception("No tienes permiso para editar esta cotización.");
                }
            }
            $stmt = $pdo->prepare("UPDATE cotizaciones SET quote_no = ?, cliente_json = ?, items_json = ?, subtotal = ?, iva = ?, total = ? WHERE id = ?");
            $stmt->execute([$quote_no, $cliente_json, $items_json, $subtotal, $iva, $total, $id]);
            $inserted_id = $id;
        } else {
            $stmt = $pdo->prepare("INSERT INTO cotizaciones (quote_no, usuario_id, cliente_json, items_json, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$quote_no, $user['id'], $cliente_json, $items_json, $subtotal, $iva, $total]);
            $inserted_id = $pdo->lastInsertId();
        }

        echo json_encode(["success" => true, "id" => $inserted_id]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'delete_quote') {
    $user = require_auth($pdo);
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        if (!$id) throw new Exception("ID requerido");
        
        if ($user['rol'] !== 'admin') {
            $check = $pdo->prepare("SELECT usuario_id FROM cotizaciones WHERE id = ?");
            $check->execute([$id]);
            if ($check->fetchColumn() != $user['id']) {
                throw new Exception("No tienes permiso para eliminar esta cotización.");
            }
        }

        $stmt = $pdo->prepare("DELETE FROM cotizaciones WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
elseif ($action === 'get_next_quote_no') {
    require_auth($pdo);
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
elseif ($action === 'send_email') {
    require_auth($pdo);
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

        if (!$to_email || !$pdf_base64) throw new Exception("Faltan datos obligatorios (email o PDF).");

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
        
        $htmlBody = htmlspecialchars($body);
        $htmlBody = preg_replace('/(https?:\/\/[^\s<]+)/', '<a href="$1" target="_blank">$1</a>', $htmlBody);
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
