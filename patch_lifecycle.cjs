const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

const targetStr = `          const dialogues = isChecking ? streamingDialogues : (activeRun?.agentDialogues || []);
          const activeAgentId = dialogues.length > 0 ? dialogues[dialogues.length - 1].agentId : null;`;

const newStr = `          const dialogues = isChecking ? streamingDialogues : (activeRun?.agentDialogues || []);
          const logs = isChecking ? streamingLogs : (activeRun?.logs || []);
          
          let activeAgentId = null;
          
          // Try to get agent from the most recent dialogue
          if (dialogues.length > 0) {
            activeAgentId = dialogues[dialogues.length - 1].agentId;
          }
          
          // If we also have logs, see if the most recent log mentions an agent
          // and if its timestamp is newer than the dialogue's timestamp (or we assume the last log is more recent in stream)
          if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            const match = lastLog.message.match(/\\[(Alice|Bob|Charlie|David|Ethan)\\s/i);
            if (match) {
              const logAgentId = match[1].toLowerCase();
              // In streaming mode, the very last log added is considered the most recent event.
              activeAgentId = logAgentId;
            }
          }`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
