interface GiveawayJSON {
  alive: string[];
  dead: string[];
}

const data = await Bun.file('json.json').json() as GiveawayJSON;

console.log(`📊 ${data.alive.length} alive | ${data.dead.length} dead`);

// Generate markdown
let markdown = `# InstantGaming's Giveaway List

> Auto-updated from \`json.json\` via GitHub Actions  
> Last update: ${new Date().toLocaleString('en-US', { timeZone: 'CET' })}

## 🚀 Quick Actions

**Open All Active Giveaways (${data.alive.length}):**  
Drag this bookmarklet to your bookmarks bar →
\`\`\`javascript
javascript:(function(){fetch('https://raw.githubusercontent.com/MaitreGEEK/InstantGamingGiveawayList/main/json.json').then(r=>r.json()).then(d=>{d.alive.forEach((s,i)=>setTimeout(()=>window.open('https://www.instant-gaming.com/fr/giveaway/'+s),i*300))})})()
\`\`\`

**Open All Archived Giveaways (${data.dead.length}):**  
Drag this bookmarklet to your bookmarks bar →
\`\`\`javascript
javascript:(function(){fetch('https://raw.githubusercontent.com/MaitreGEEK/InstantGamingGiveawayList/main/json.json').then(r=>r.json()).then(d=>{d.dead.forEach((s,i)=>setTimeout(()=>window.open('https://www.instant-gaming.com/fr/giveaway/'+s),i*300))})})()
\`\`\`

---

## How to participate?

### Manually
Create an account on [Instant Gaming](https://www.instant-gaming.com) and click on the links below.

### Automatically
Install [this userscript](https://github.com/enzomtpYT/InstantGaming-Giveaway-AutoParticipate) for auto-participation.

---

## 🟢 Active Giveaways (${data.alive.length})

`;

// Generate HTML images section
markdown += `<p id="giveaways" align="left">\n`;

data.alive.forEach(slug => {
  const url = `https://www.instant-gaming.com/fr/giveaway/${slug}`;
  const imgUrl = `https://gaming-cdn.com/images/avatars/default.jpg`;
  markdown += `    <a class="giveaway" href="${url}" target="_blank" rel="noreferrer">
        <img src="${imgUrl}" alt="${slug}" width="76" height="76" onerror="this.src='https://gaming-cdn.com/themes/igv2/images/avatar2.svg'" />
    </a>\n`;
});

markdown += `</p>\n\n`;

// Markdown table fallback
markdown += `| Slug | Direct Link |\n`;
markdown += `|------|-------------|\n`;
data.alive.forEach(slug => {
  const url = `https://www.instant-gaming.com/fr/giveaway/${slug}`;
  markdown += `| \`${slug}\` | [Participate](${url}) |\n`;
});

// Dead giveaways in collapsed section
if (data.dead.length > 0) {
  markdown += `\n<details>\n<summary>🔴 Archived/Dead Giveaways (${data.dead.length})</summary>\n\n`;
  markdown += `| Slug | Link |\n|------|------|\n`;
  data.dead.forEach(slug => {
    markdown += `| \`${slug}\` | ~~https://www.instant-gaming.com/fr/giveaway/${slug}~~ |\n`;
  });
  markdown += `\n</details>\n`;
}

markdown += `\n---\n\n**Found a new giveaway?** Edit \`json.json\` and submit a PR!\n`;

await Bun.write('readme.md', markdown);
console.log('✅ readme.md updated with', data.alive.length, 'active giveaways');
