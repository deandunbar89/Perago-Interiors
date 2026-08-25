' Starts the Perago/TenderCRM server in the background, with no visible window.
' Runs automatically at Windows login (see the shortcut in the Startup folder).
' If the server is already running, "npm run dev" simply fails quietly to bind
' the port again — harmless.

Set objShell = CreateObject("WScript.Shell")
command = "cmd /c cd /d ""C:\Users\SURFACE LAPTOP\Desktop\Claude\tender-crm"" && set PATH=%PATH%;C:\Program Files\nodejs && npm run dev"
objShell.Run command, 0, False
