const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      // Handle logs streaming
      const logIdx = logQueue.findIndex(l => getStageIndex(l) <= currentStage);
      if (logIdx !== -1) {
        const nextLog = logQueue.splice(logIdx, 1)[0];
        currentLogs = [...currentLogs, nextLog];
        setStreamingLogs(currentLogs);
        madeProgress = true;
      }

      // Handle dialogues streaming
      const dialIdx = dialogueQueue.findIndex(d => getStageIndex(d) <= currentStage);
      if (dialIdx !== -1) {
        const nextDial = dialogueQueue.splice(dialIdx, 1)[0];
        currentDialogues = [...currentDialogues, nextDial];
        setStreamingDialogues(currentDialogues);
        madeProgress = true;
      }`;

const newStr = `      // Handle unified streaming (interleaved)
      const logIdx = logQueue.findIndex(l => getStageIndex(l) <= currentStage);
      const dialIdx = dialogueQueue.findIndex(d => getStageIndex(d) <= currentStage);
      
      if (logIdx !== -1 && dialIdx !== -1) {
         // Both are available. Pick one randomly or alternate, let's alternate based on length or just pick log first then dialogue
         // Actually, let's pick log 60% of time if both are available to keep them mixed
         if (Math.random() > 0.4) {
            const nextLog = logQueue.splice(logIdx, 1)[0];
            currentLogs = [...currentLogs, nextLog];
            setStreamingLogs(currentLogs);
         } else {
            const nextDial = dialogueQueue.splice(dialIdx, 1)[0];
            currentDialogues = [...currentDialogues, nextDial];
            setStreamingDialogues(currentDialogues);
         }
         madeProgress = true;
      } else if (logIdx !== -1) {
         const nextLog = logQueue.splice(logIdx, 1)[0];
         currentLogs = [...currentLogs, nextLog];
         setStreamingLogs(currentLogs);
         madeProgress = true;
      } else if (dialIdx !== -1) {
         const nextDial = dialogueQueue.splice(dialIdx, 1)[0];
         currentDialogues = [...currentDialogues, nextDial];
         setStreamingDialogues(currentDialogues);
         madeProgress = true;
      }`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/App.tsx', code);
