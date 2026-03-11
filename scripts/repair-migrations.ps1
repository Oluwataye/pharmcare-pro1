# Mark all old migrations as already applied in Supabase's remote migration history.
# This means Supabase will skip them and only push the NEW system_license migration.

$timestamps = @(
    "20240601000001",
    "20251014191032",
    "20251015231253",
    "20251017124225",
    "20251107123014",
    "20251111102208",
    "20251112174853",
    "20251112175347",
    "20251112175424",
    "20251202183241",
    "20251204111211",
    "20251223125154",
    "20260113000000",
    "20260114000000",
    "20260127000000",
    "20260127000001",
    "20260127000002",
    "20260127000003",
    "20260127000004",
    "20260127000005",
    "20260127000006",
    "20260128000000",
    "20260128000001",
    "20260131000000",
    "20260131000001",
    "20260131000002",
    "20260131000003",
    "20260201000000",
    "20260201000001",
    "20260201000002",
    "20260201000003",
    "20260201000004",
    "20260202000000",
    "20260202000001",
    "20260202000002",
    "20260202162100",
    "20260202162200",
    "20260202235950",
    "20260202235951"
)

Write-Host "Marking all old migrations as applied..." -ForegroundColor Cyan

foreach ($ts in $timestamps) {
    Write-Host "  Repairing: $ts" -ForegroundColor Gray
    supabase migration repair --status applied $ts
}

Write-Host "`nAll old migrations marked as applied!" -ForegroundColor Green
Write-Host "Now running db push to apply ONLY the new system_license migration..." -ForegroundColor Cyan
supabase db push
