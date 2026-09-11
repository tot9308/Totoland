$map = [ordered]@{
  "hover:bg-emerald-700"   = "hover:bg-[#4a6a3a]"
  "hover:bg-emerald-50"    = "hover:bg-stone-100"
  "hover:bg-emerald-100"   = "hover:bg-stone-200"
  "hover:bg-sky-700"       = "hover:bg-[#497691]"
  "hover:bg-rose-700"      = "hover:bg-[#9c4f31]"
  "hover:bg-amber-700"     = "hover:bg-[#b08f47]"
  "hover:bg-red-700"       = "hover:bg-[#9c4f31]"
  "focus:ring-emerald-500" = "focus:ring-[#5a7d4a]"
  "focus:ring-emerald-600" = "focus:ring-[#5a7d4a]"
  "ring-emerald-500"       = "ring-[#5a7d4a]"
  "bg-emerald-600"         = "bg-[#5a7d4a]"
  "bg-emerald-50"          = "bg-stone-50"
  "bg-emerald-100"         = "bg-stone-100"
  "text-emerald-900"       = "text-stone-800"
  "text-emerald-800"       = "text-stone-700"
  "text-emerald-700"       = "text-stone-600"
  "text-emerald-600"       = "text-stone-500"
  "border-emerald-300"     = "border-stone-300"
  "border-emerald-200"     = "border-stone-200"
  "bg-white"               = "bg-[#faf7f0]"
  "bg-sky-600"             = "bg-[#5a8ca6]"
  "bg-sky-50"              = "bg-[#eaf1ee]"
  "bg-sky-100"             = "bg-[#dfe9e4]"
  "text-sky-900"           = "text-stone-800"
  "text-sky-800"           = "text-stone-700"
  "text-sky-700"           = "text-stone-600"
  "text-sky-600"           = "text-stone-500"
  "border-sky-300"         = "border-stone-300"
  "bg-rose-50"             = "bg-[#f5ece6]"
  "bg-rose-600"            = "bg-[#b5603d]"
  "bg-rose-100"            = "bg-[#ecd9cd]"
  "text-rose-900"          = "text-stone-800"
  "text-rose-800"          = "text-stone-700"
  "text-rose-700"          = "text-[#8a3a1a]"
  "border-rose-300"        = "border-stone-300"
  "bg-amber-50"            = "bg-[#f7f0e3]"
  "bg-amber-600"           = "bg-[#c9a45a]"
  "bg-amber-100"           = "bg-[#efe3c8]"
  "text-amber-900"         = "text-stone-800"
  "text-amber-800"         = "text-stone-700"
  "text-amber-700"         = "text-[#8a6a2a]"
  "border-amber-300"       = "border-stone-300"
  "border-amber-400"       = "border-[#c9a45a]"
  "bg-red-600"             = "bg-[#b5603d]"
  "text-red-600"           = "text-[#8a3a1a]"
}

Get-ChildItem -Path app,components -Recurse -Filter *.tsx | ForEach-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  $orig = $c
  foreach ($k in $map.Keys) { $c = $c.Replace($k, $map[$k]) }
  if ($c -ne $orig) {
    Set-Content -Path $_.FullName -Value $c -Encoding UTF8 -NoNewline
    Write-Host "Actualizado: $($_.Name)"
  }
}
Write-Host "Listo."