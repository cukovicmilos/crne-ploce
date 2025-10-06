<?php
require_once 'auth.php';
requireAuth();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'api/discogs.php';
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$releaseId = $input['releaseId'] ?? '';

if (empty($releaseId) || !is_numeric($releaseId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid release ID is required']);
    exit;
}

try {
    $discogs = new DiscogsAPI(DISCOGS_TOKEN);

    $recordDir = "records/$releaseId";
    if (is_dir($recordDir)) {
        echo json_encode(['error' => 'Record already exists in collection']);
        exit;
    }

    $release = $discogs->getRelease($releaseId);

    if (!$release) {
        throw new Exception('Release not found');
    }

    if (!mkdir($recordDir, 0777, true)) {
        $error = error_get_last();
        throw new Exception('Failed to create record directory: ' . ($error['message'] ?? 'Unknown error'));
    }

    $artists = [];
    if (isset($release['artists'])) {
        foreach ($release['artists'] as $artist) {
            $artists[] = $artist['name'];
        }
    }

    $tracklist = [];
    if (isset($release['tracklist'])) {
        foreach ($release['tracklist'] as $track) {
            $tracklist[] = [
                'position' => $track['position'] ?? '',
                'title' => $track['title'] ?? '',
                'duration' => $track['duration'] ?? ''
            ];
        }
    }

    $coverUrl = null;
    $coverPath = null;
    if (isset($release['images'][0]['uri'])) {
        $coverUrl = $release['images'][0]['uri'];
        $coverPath = "$recordDir/cover.jpg";

        if (!$discogs->downloadImage($coverUrl, $coverPath)) {
            $coverPath = null;
        }
    }

    $markdownContent = "# " . ($release['title'] ?? 'Unknown Title') . "\n\n";
    $markdownContent .= "**Izvođač:** " . implode(', ', $artists) . "\n";
    $markdownContent .= "**Godina:** " . ($release['year'] ?? 'Unknown') . "\n";
    $markdownContent .= "**Žanr:** " . implode(', ', $release['genres'] ?? []) . "\n";
    $markdownContent .= "**Stil:** " . implode(', ', $release['styles'] ?? []) . "\n";
    $markdownContent .= "**Label:** " . (isset($release['labels'][0]['name']) ? $release['labels'][0]['name'] : 'Unknown') . "\n";
    $markdownContent .= "**Discogs ID:** $releaseId\n\n";

    if (!empty($tracklist)) {
        $markdownContent .= "## Spisak Pesama\n\n";
        foreach ($tracklist as $track) {
            $position = $track['position'] ? $track['position'] . '. ' : '';
            $duration = $track['duration'] ? " ({$track['duration']})" : '';
            $markdownContent .= "- {$position}{$track['title']}{$duration}\n";
        }
    }

    if (!file_put_contents("$recordDir/$releaseId.md", $markdownContent)) {
        throw new Exception('Failed to create record file');
    }

    $indexFile = 'records/index.json';
    $index = [];
    if (file_exists($indexFile)) {
        $index = json_decode(file_get_contents($indexFile), true) ?: [];
    }

    $recordData = [
        'id' => $releaseId,
        'title' => $release['title'] ?? 'Unknown Title',
        'artists' => $artists,
        'year' => $release['year'] ?? null,
        'cover' => $coverPath ? "records/$releaseId/cover.jpg" : null,
        'genres' => $release['genres'] ?? [],
        'added' => date('Y-m-d H:i:s')
    ];

    $index[] = $recordData;

    if (!file_put_contents($indexFile, json_encode($index, JSON_PRETTY_PRINT))) {
        throw new Exception('Failed to update index');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Record added successfully',
        'record' => $recordData
    ]);

} catch (Exception $e) {
    if (isset($recordDir) && is_dir($recordDir)) {
        array_map('unlink', glob("$recordDir/*"));
        rmdir($recordDir);
    }

    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>