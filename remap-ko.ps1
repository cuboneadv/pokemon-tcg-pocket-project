# Remap ko.json: replace pocketgg global IDs with TCGdex local IDs
# Pattern: A1a-{2000+n} -> A1a-{n padded 3}, A2-{3000+n} -> A2-{n padded 3}
# Other sets (A2a offset 4000?, A2b, A3...) - check and remap all

$koRaw = Get-Content 'data\ko.json' -Raw -Encoding UTF8
$koObj = $koRaw | ConvertFrom-Json

# First, discover offsets for all non-A1 sets by checking the minimum global ID
$setsToRemap = @{}
foreach ($prop in $koObj.PSObject.Properties) {
    if ($prop.Name -match '^(A1a|A2[ab]?|A3[ab]?|A4[ab]?)-(\d+)$') {
        $setId  = $Matches[1]
        $numStr = $Matches[2]
        $num    = [int]$numStr
        if (-not $setsToRemap.ContainsKey($setId) -or $num -lt $setsToRemap[$setId]) {
            $setsToRemap[$setId] = $num  # store minimum globalId per set
        }
    }
}

Write-Host "Detected set offsets (min globalId per set):"
foreach ($s in ($setsToRemap.Keys | Sort-Object)) {
    $minId  = $setsToRemap[$s]
    $offset = $minId - 1  # offset = minGlobalId - 1 (so card 1 = minGlobalId)
    Write-Host "  $s : minId=$minId  offset=$offset"
    $setsToRemap[$s] = $offset
}

# Build new JSON object
$newEntries = [System.Collections.Generic.Dictionary[string,object]]::new()

foreach ($prop in $koObj.PSObject.Properties) {
    $key = $prop.Name
    $val = $prop.Value

    if ($key -match '^(A1a|A2[ab]?|A3[ab]?|A4[ab]?)-(\d+)$') {
        $setId  = $Matches[1]
        $num    = [int]$Matches[2]
        $offset = $setsToRemap[$setId]
        $localNum = $num - $offset
        $newKey = "$setId-" + $localNum.ToString("000")
        $newEntries[$newKey] = $val
    } else {
        $newEntries[$key] = $val
    }
}

Write-Host "`nRemap complete. Sample output:"
$newEntries.Keys | Where-Object { $_ -like 'A1a-00*' } | Sort-Object | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $_ => $($newEntries[$_].name)"
}
$newEntries.Keys | Where-Object { $_ -like 'A2-00*' } | Sort-Object | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $_ => $($newEntries[$_].name)"
}

Write-Host "`nTotal entries: $($newEntries.Count)"

# Save
$newJson = $newEntries | ConvertTo-Json -Depth 10 -Compress
[System.IO.File]::WriteAllText(
    (Resolve-Path 'data\ko.json').Path,
    $newJson,
    [System.Text.Encoding]::UTF8
)
Write-Host "Saved data\ko.json"
