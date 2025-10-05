<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$releaseId = $input['releaseId'] ?? '';

if (empty($releaseId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Release ID is required']);
    exit;
}

try {
    $recordDir = "records/$releaseId";

    if (!is_dir($recordDir)) {
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        exit;
    }

    // Delete all files in the record directory
    $files = glob("$recordDir/*");
    foreach ($files as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }

    // Remove the directory
    if (!rmdir($recordDir)) {
        throw new Exception('Failed to delete record directory');
    }

    // Update index
    $indexFile = 'records/index.json';
    $index = [];
    if (file_exists($indexFile)) {
        $index = json_decode(file_get_contents($indexFile), true) ?: [];
    }

    // Remove record from index
    $index = array_filter($index, function($record) use ($releaseId) {
        return $record['id'] !== $releaseId;
    });

    // Reindex array to remove gaps
    $index = array_values($index);

    if (!file_put_contents($indexFile, json_encode($index, JSON_PRETTY_PRINT))) {
        throw new Exception('Failed to update index');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Record deleted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>