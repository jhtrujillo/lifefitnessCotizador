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
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    $token = null;

    if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    } elseif (!empty($_POST['auth_token'])) {
        $token = $_POST['auth_token'];
    } elseif (!empty($_GET['token'])) {
        $token = $_GET['token'];
    }

    if (!$token) {
        echo json_encode(["success" => false, "error" => "Token no proporcionado", "auth_failed" => true]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, username, rol, nombre FROM usuarios WHERE token = ?");
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
} elseif ($action === 'generate_pdf_direct') {
    require_auth($pdo);
    try {
        $html = $_POST['html'] ?? '';
        $filename = $_POST['filename'] ?? 'Cotizacion.pdf';
        
        require 'libs/vendor/autoload.php';
        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $dompdf = new \Dompdf\Dompdf($options);
        
        $fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #333; }
            .print-container { width: 100%; max-width: 100%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #2d2d2d; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
            td { padding: 8px; vertical-align: top; border-bottom: 1px solid #e0e0e0; }
            .totals-bg { background-color: #e63946; color: white; padding: 10px; font-weight: bold; font-size: 16px; border-radius: 4px; }
            .doc-head img { height: 60px; }
            .info-grid-mobile { width: 100%; }
            .info-grid-mobile > div { display: inline-block; width: 48%; vertical-align: top; }
        </style></head><body>' . $html . '</body></html>';
        
        $dompdf->loadHtml($fullHtml);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . $filename . '"');
        header('Cache-Control: private, max-age=0, must-revalidate');
        header('Pragma: public');
        
        echo $dompdf->output();
        exit;
    } catch (Exception $e) {
        die("Error generando PDF: " . $e->getMessage());
    }
} elseif ($action === 'generate_pdf') {
    require_auth($pdo);
    try {
        ini_set('memory_limit', '256M');
        set_time_limit(60);
        ob_start(); // Prevent warnings from breaking JSON
        
        $input = json_decode(file_get_contents('php://input'), true);
        $html = $input['html'] ?? '';
        
        // Evitar el error "Frame not found in cellmap" de Dompdf reemplazando border-collapse: collapse
        // por separate + border-spacing: 0 (visualmente idéntico pero seguro contra caídas de página)
        $html = preg_replace('/border-collapse\s*:\s*collapse/i', 'border-collapse: separate; border-spacing: 0;', $html);
        
        // Evitar otro bug fatal de Dompdf: "display: table-cell" dentro de un <td> colapsa el layout
        $html = preg_replace('/display\s*:\s*table-cell/i', 'display: block', $html);
        
        if (!file_exists('libs/vendor/autoload.php')) {
            ob_end_clean();
            echo json_encode(["success" => false, "error" => "El directorio 'libs/vendor' no se encuentra en el servidor. Por favor, sube la carpeta 'libs' completa a DreamHost."]);
            exit;
        }
        
        require 'libs/vendor/autoload.php';
        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->setChroot(__DIR__);
        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->setBasePath(__DIR__);
        
        // Forzar rutas absolutas locales para que Dompdf encuentre las imágenes
        $html = preg_replace('/src="(?!(http|data:|\/))([^"]+)"/i', 'src="' . __DIR__ . '/$1"', $html);
        
        $fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #333; }
            .print-container { width: 100%; max-width: 100%; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; }
            th { background-color: #2d2d2d; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
            td { padding: 8px; vertical-align: top; border-bottom: 1px solid #e0e0e0; }
            .totals-bg { background-color: #e63946; color: white; padding: 10px; font-weight: bold; font-size: 16px; border-radius: 4px; }
            .doc-head img { height: 60px; }
            
            /* Compatibilidad de Flex y Grid para Dompdf */
            .pdf-meta { width: 100%; display: block !important; margin-bottom: 30px; }
            .pdf-meta > div { display: inline-block !important; width: 48% !important; vertical-align: top !important; }
            div[style*="display: flex"], div[style*="display:flex"] { display: block !important; }
        </style></head><body>' . $html . '</body></html>';
        
        $dompdf->loadHtml($fullHtml);
        $dompdf->setPaper('letter', 'portrait');
        $dompdf->render();
        ob_end_clean(); // Discard any warnings/errors printed
        echo json_encode(["success" => true, "pdf" => base64_encode($dompdf->output())]);
    } catch (\Throwable $e) {
        ob_end_clean();
        file_put_contents('crash_html.txt', $html);
        echo json_encode(["success" => false, "error" => "Fallo interno en el generador de PDF: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine()]);
    }
} elseif ($action === 'send_email') {
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
