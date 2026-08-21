<?php
$host = "127.0.0.1";
$port = "8889";
$dbname = "fitness_life";
$username = "root";
$password = "root";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $tables = ['usuarios', 'clientes', 'productos', 'cotizaciones'];
    $sql = "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n";

    foreach ($tables as $table) {
        $sql .= "DROP TABLE IF EXISTS `$table`;\n";
        $stmt = $pdo->query("SHOW CREATE TABLE `$table`");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $sql .= $row['Create Table'] . ";\n\n";
        }

        $stmt = $pdo->query("SELECT * FROM `$table`");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (count($rows) > 0) {
            $sql .= "INSERT INTO `$table` (";
            $keys = array_keys($rows[0]);
            $sql .= "`" . implode("`, `", $keys) . "`";
            $sql .= ") VALUES \n";

            $values = [];
            foreach ($rows as $r) {
                $row_values = [];
                foreach ($r as $val) {
                    if (is_null($val)) {
                        $row_values[] = "NULL";
                    } else {
                        $row_values[] = $pdo->quote($val);
                    }
                }
                $values[] = "(" . implode(", ", $row_values) . ")";
            }
            $sql .= implode(",\n", $values) . ";\n\n";
        }
    }
    
    $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    file_put_contents('base_de_datos.sql', $sql);
    echo "Done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
