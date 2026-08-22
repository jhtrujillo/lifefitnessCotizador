<?php
$html = file_get_contents('stripped.html');
$doc = new DOMDocument();
@$doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);
$tables = $doc->getElementsByTagName('table');
echo $doc->saveHTML($tables->item(0));
