<?php
$html = file_get_contents('new_crash.html');
$html = preg_replace('/^<table class="pdf-frame">.*?<tbody><tr><td>(.*?)<\/td><\/tr><\/tbody><\/table>.*$/is', '$1', $html);
file_put_contents('stripped.html', $html);
