<?php

class DiscogsAPI {
    private $token;
    private $userAgent;
    private $baseUrl = 'https://api.discogs.com';

    public function __construct($token) {
        $this->token = $token;
        $this->userAgent = 'CrnePloce/1.0 +http://localhost';
    }

    private function makeRequest($endpoint, $params = []) {
        $url = $this->baseUrl . $endpoint;

        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $headers = [
            'Authorization: Discogs token=' . $this->token,
            'User-Agent: ' . $this->userAgent
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("Discogs API error: HTTP $httpCode");
        }

        return json_decode($response, true);
    }

    public function getRelease($releaseId) {
        return $this->makeRequest("/releases/$releaseId");
    }

    public function downloadImage($imageUrl, $savePath) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $imageUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $imageData !== false) {
            return file_put_contents($savePath, $imageData);
        }

        return false;
    }
}