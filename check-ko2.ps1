$raw = Get-Content 'data\ko.json' -Raw
$matches2 = [regex]::Matches($raw, '"(A\w+)-\d+"')
$prefixes = $matches2 | ForEach-Object { $_.Groups[1].Value }
$groups = $prefixes | Group-Object | Sort-Object Name
Write-Host 'Sets in ko.json:'
foreach ($g in $groups) {
    Write-Host ("  " + $g.Name + ": " + $g.Count + " cards")
}
Write-Host ('Total entries: ' + $matches2.Count)
