<?php
require 'libs/vendor/autoload.php';
$options = new \Dompdf\Options();
$dompdf = new \Dompdf\Dompdf($options);
$html = '<table class="pdf-frame">
  <thead>
    <tr><td>
      <div class="pdf-running-header">
        <img src="assets/logo.png" />
      </div>
    </td></tr>
  </thead>
  <tbody>
    <tr><td>
      <div class="doc-head">
        <table>
          <tbody>
            <tr>
              <td>Logo here</td>
              <td>Text here</td>
            </tr>
          </tbody>
        </table>
      </div>
    </td></tr>
  </tbody>
</table>';
$dompdf->loadHtml($html);
$dompdf->render();
echo "Success!\n";
