<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require 'libs/vendor/autoload.php';
$options = new \Dompdf\Options();
$options->set('isRemoteEnabled', true);
$dompdf = new \Dompdf\Dompdf($options);

$html = '<h1>Test PDF</h1><p>This is a test of Dompdf on DreamHost.</p>';
$dompdf->loadHtml($html);
$dompdf->setPaper('letter', 'portrait');
$dompdf->render();
header('Content-Type: application/pdf');
echo $dompdf->output();
