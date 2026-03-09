# Check a sample A1a entry's content
$raw = Get-Content 'data\ko.json' -Raw
$match = [regex]::Match($raw, '"A1a-2072"\s*:\s*(\{[^}]+\})')
Write-Host "Sample A1a-2072 entry:"
Write-Host $match.Groups[1].Value

$match2 = [regex]::Match($raw, '"A1-134"\s*:\s*(\{[^}]+\})')
Write-Host "`nSample A1-134 entry:"
Write-Host $match2.Groups[1].Value
