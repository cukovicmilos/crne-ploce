<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$releaseId = $_GET['id'] ?? '';

if (empty($releaseId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Release ID is required']);
    exit;
}

$recordFile = "records/$releaseId/$releaseId.md";
if (!file_exists($recordFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Record not found']);
    exit;
}

$content = file_get_contents($recordFile);
$coverPath = "records/$releaseId/cover.jpg";
$hasCover = file_exists($coverPath);

echo json_encode([
    'id' => $releaseId,
    'content' => $content,
    'cover' => $hasCover ? $coverPath : null
]);
?>