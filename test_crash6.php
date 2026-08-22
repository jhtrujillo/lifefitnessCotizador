<?php
require 'libs/vendor/autoload.php';
$html = file_get_contents('stripped.html');
$html = str_replace('display: table-cell;', 'display: block;', $html);
$options = new \Dompdf\Options();
$options->set('isRemoteEnabled', true);
$dompdf = new \Dompdf\Dompdf($options);
$fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #333; }
</style></head><body>' . $html . '</body></html>';
$dompdf->loadHtml($fullHtml);
$dompdf->setPaper('letter', 'portrait');
try {
    $dompdf->render();
    echo "SUCCESS STRIPPED AND FIXED!\n";
} catch (\Throwable $e) {
    echo "CRASH: " . $e->getMessage() . "\n";
}
