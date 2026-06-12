# agendar_tarefa.ps1
# Cria uma tarefa no Windows Task Scheduler para rodar o scraper toda segunda às 3h
# Execute com: powershell -ExecutionPolicy Bypass -File agendar_tarefa.ps1

$ProjetoPasta = "C:\Users\PREFEITURA2025\Projetos\busontime"
$PythonPath   = "$ProjetoPasta\.venv\Scripts\python.exe"
$ScriptPath   = "$ProjetoPasta\atualizar_tudo.py"
$LogPath      = "$ProjetoPasta\logs\task-scheduler.log"
$NomeTarefa   = "BusOnTime-AtualizarHorarios"

# Garante que a pasta de logs existe
New-Item -ItemType Directory -Force -Path "$ProjetoPasta\logs" | Out-Null

# Ação: rodar o Python com o script
$Acao = New-ScheduledTaskAction `
    -Execute $PythonPath `
    -Argument "-W ignore `"$ScriptPath`" --forcar" `
    -WorkingDirectory $ProjetoPasta

# Gatilho: toda segunda-feira às 03:00
$Gatilho = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday `
    -At "03:00AM"

# Configurações
$Configuracoes = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 30) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

# Principal (roda com o usuário atual)
$Principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Highest

# Remove tarefa anterior se existir
if (Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $NomeTarefa -Confirm:$false
    Write-Host "Tarefa anterior removida." -ForegroundColor Yellow
}

# Registra a tarefa
Register-ScheduledTask `
    -TaskName $NomeTarefa `
    -Action $Acao `
    -Trigger $Gatilho `
    -Settings $Configuracoes `
    -Principal $Principal `
    -Description "BusOnTime: atualiza horários de ônibus toda segunda às 3h"

Write-Host ""
Write-Host "✅ Tarefa '$NomeTarefa' criada com sucesso!" -ForegroundColor Green
Write-Host "   Roda: toda segunda-feira às 03:00" -ForegroundColor Cyan
Write-Host "   Python: $PythonPath" -ForegroundColor Cyan
Write-Host "   Script: $ScriptPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver a tarefa: Agendador de Tarefas > Biblioteca > $NomeTarefa"
Write-Host "Para rodar agora:  Start-ScheduledTask -TaskName '$NomeTarefa'"
Write-Host "Para remover:      Unregister-ScheduledTask -TaskName '$NomeTarefa' -Confirm:`$false"
Write-Host ""
Write-Host "Para mudar o horário, edite este arquivo e rode novamente."
