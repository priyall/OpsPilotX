const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

const targetStr = `          let activeAgentId = null;
          
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

const newStr = `          let activeAgentId = null;
          
          // We want the most recently mentioned agent in the streams.
          // Since the streams are ordered by time of addition, we can just look backwards in logs.
          let lastLogAgent = null;
          for (let i = logs.length - 1; i >= 0; i--) {
             const match = logs[i].message.match(/\\[(Alice|Bob|Charlie|David|Ethan)\\s/i);
             if (match) {
                lastLogAgent = match[1].toLowerCase();
                break;
             }
          }
          
          let lastDialAgent = dialogues.length > 0 ? dialogues[dialogues.length - 1].agentId : null;
          
          // Just pick the log agent if it exists, otherwise the dialogue agent.
          // (Since logs are usually more frequent and come alongside dialogues).
          activeAgentId = lastLogAgent || lastDialAgent || null;`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
