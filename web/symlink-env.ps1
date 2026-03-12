# Run this script as Administrator
$target = Resolve-Path "..\.env.local"
New-Item -Path ".env.local" -ItemType SymbolicLink -Value $target
