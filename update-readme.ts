interface Giveaway {
  slug: string;
  name: string;
  url: string;
  active?: boolean;
}

const rawData = await Bun.file('json.json').json();

// Handle different JSON structures
let jsonData: Giveaway[];

if (Array.isArray(rawData)) {
  jsonData = rawData;
} else if (rawData.giveaways && Array.isArray(rawData.giveaways)) {
  jsonData = rawData.giveaways;
} else if (typeof rawData === 'object') {
  // Convert object to array
  jsonData = Object.entries(rawData).map(([key, value]: [string, any]) => ({
    slug: value.slug || key,
    name: value.name || key,
    url: value.url || `https://www.instant-gaming.com/fr/giveaway/${value.slug || key}`,
    active: value.active !== false
  }));
} else {
  console.error('❌ Invalid JSON structure');
  process.exit(1);
}

console.log(`📊 Found ${jsonData.length} giveaways`);

// Generate markdown table
const activeGiveaways = jsonData.filter(g => g.active !== false);
const inactiveGiveaways = jsonData.filter(g => g.active === false);

let markdown = `# InstantGaming Giveaway List

> Auto-updated from \`json.json\` via GitHub Actions

## Active Giveaways (${activeGiveaways.length})

| Name | Link |
|------|------|
`;

activeGiveaways.forEach(g => {
  markdown += `| ${g.name} | [Participate](${g.url}) |\n`;
});

if (inactiveGiveaways.length > 0) {
  markdown += `\n## Archived Giveaways (${inactiveGiveaways.length})\n\n`;
  markdown += `<details>\n<summary>Show archived</summary>\n\n`;
  markdown += `| Name | Link |\n|------|------|\n`;
  inactiveGiveaways.forEach(g => {
    markdown += `| ${g.name} | ~~${g.url}~~ |\n`;
  });
  markdown += `\n</details>\n`;
}

markdown += `\n---\n*Last updated: ${new Date().toISOString()}*\n`;

await Bun.write('README.md', markdown);
console.log('✅ README updated');
