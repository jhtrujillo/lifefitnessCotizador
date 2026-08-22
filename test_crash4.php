<?php
require 'libs/vendor/autoload.php';
$html = file_get_contents('stripped.html');
$options = new \Dompdf\Options();
$options->set('isRemoteEnabled', true);
$dompdf = new \Dompdf\Dompdf($options);
$fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #333; }
    .print-container { width: 100%; max-width: 100%; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; }
    th { background-color: #2d2d2d; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px; vertical-align: top; border-bottom: 1px solid #e0e0e0; }
</style></head><body>' . $html . '</body></html>';
$dompdf->loadHtml($fullHtml);
$dompdf->setPaper('letter', 'portrait');
try {
    $dompdf->render();
    echo "SUCCESS STRIPPED\n";
} catch (\Throwable $e) {
    echo "CRASH STRIPPED: " . $e->getMessage() . "\n";
}
