$raw = Get-Content 'data\ko.json' -Raw
$data = $raw | ConvertFrom-Json
$props = $data.PSObject.Properties
$sets = @{}
foreach ($p in $props) {
    $prefix = $p.Name.Split('-')[0]
    if (-not $sets.ContainsKey($prefix)) { $sets[$prefix] = 0 }
    $sets[$prefix]++
}
Write-Host 'Cards per set in ko.json:'
$sets.Keys | Sort-Object | ForEach-Object { Write-Host ("  " + $_ + ": " + $sets[$_]) }
Write-Host ('Total: ' + ($props | Measure-Object).Count)
$a1aSample = ($props | Where-Object { $_.Name -like 'A1a-*' } | Select-Object -First 1).Name
$a2Sample  = ($props | Where-Object { $_.Name -like 'A2-*'  } | Select-Object -First 1).Name
Write-Host ('A1a sample key: ' + $a1aSample)
Write-Host ('A2 sample key:  ' + $a2Sample)
