<?php
require 'libs/vendor/autoload.php';
$html = file_get_contents('stripped.html');

// Try replacing the items-table
$html_no_items = preg_replace('/<table.*?<\/table>/is', '', $html, 1); 
// Wait, there are multiple tables. Let's do it manually.

