$body = @{
    prompt = "What is Exprezzzo Power in one sentence?"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/power" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json