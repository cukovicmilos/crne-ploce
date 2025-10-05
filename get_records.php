<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$indexFile = 'records/index.json';

if (!file_exists($indexFile)) {
    echo json_encode([]);
    exit;
}

$records = json_decode(file_get_contents($indexFile), true);

if (!$records) {
    echo json_encode([]);
    exit;
}

usort($records, function($a, $b) {
    return strcmp($b['added'], $a['added']);
});

echo json_encode($records);
?>