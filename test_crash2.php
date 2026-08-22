<?php
require 'libs/vendor/autoload.php';
$html = file_get_contents('new_crash.html');

// Try removing the outer pdf-frame table wrapper to see if it fixes it
$html = preg_replace('/<table class="pdf-frame">.*?<tbody><tr><td>(.*?)<\/td><\/tr><\/tbody><\/table>/is', '$1', $html);

$options = new \Dompdf\Options();
$options->set('isRemoteEnabled', true);
$dompdf = new \Dompdf\Dompdf($options);
$fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #333; }
    .print-container { width: 100%; max-width: 100%; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; }
    th { background-color: #2d2d2d; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px; vertical-align: top; border-bottom: 1px solid #e0e0e0; }
    .totals-bg { background-color: #e63946; color: white; padding: 10px; font-weight: bold; font-size: 16px; border-radius: 4px; }
    .doc-head img { height: 60px; }
    .pdf-meta { width: 100%; display: block !important; margin-bottom: 30px; }
    .pdf-meta > div { display: inline-block !important; width: 48% !important; vertical-align: top !important; }
    div[style*="display: flex"], div[style*="display:flex"] { display: block !important; }
</style></head><body>' . $html . '</body></html>';
$dompdf->loadHtml($fullHtml);
$dompdf->setPaper('letter', 'portrait');
try {
    $dompdf->render();
    echo "SUCCESS WITH OUTER TABLE REMOVED\n";
} catch (\Throwable $e) {
    echo "CRASH STILL: " . $e->getMessage() . "\n";
}
