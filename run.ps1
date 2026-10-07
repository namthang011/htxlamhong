$ErrorActionPreference = "Stop"

$jdk17 = "C:\Program Files\Java\jdk-17"
if (Test-Path (Join-Path $jdk17 "bin\java.exe")) {
    $env:JAVA_HOME = $jdk17
}

if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    throw "Không tìm thấy JDK. Hãy cài JDK 17 và cấu hình JAVA_HOME."
}

$javaVersion = & (Join-Path $env:JAVA_HOME "bin\java.exe") -version 2>&1
if ($javaVersion -notmatch 'version "(17|18|19|2[0-9])') {
    throw "Dự án yêu cầu Java 17 trở lên. JAVA_HOME hiện tại: $env:JAVA_HOME"
}

& "$PSScriptRoot\mvnw.cmd" spring-boot:run "-Dspring-boot.run.profiles=local"
exit $LASTEXITCODE
