interface GiveawayJSON {
  alive: string[];
  dead: string[];
}

const DELAY_MS = 500;
const TIMEOUT_MS = 5000;

async function checkGiveaway(slug: string): Promise<boolean> {
  const url = `https://www.instant-gaming.com/fr/giveaway/${slug}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 404) {
      return false;
    }
    
    const html = await response.text();
    
    // Patterns qui confirment que c'est ALIVE
    const alivePatterns = [
      /prochain tirage au sort/i,
      /next draw/i,
      /participer/i,
      /participate/i,
      /en cours/i,
      /in progress/i,
      /rejoindre le concours/i
    ];
    
    // Si on trouve un pattern alive, c'est bon
    if (alivePatterns.some(pattern => pattern.test(html))) {
      return true;
    }
    
    // Patterns d'erreur/dead
    const deadPatterns = [
      /giveaway.*not found/i,
      /concours.*introuvable/i,
      /page.*not.*exist/i,
      /erreur 404/i,
      /terminé/i, 
      /finished/i,
      /ended/i,
      /expiré/i,
      /expired/i
    ];
    
    const isDead = deadPatterns.some(pattern => pattern.test(html));
    
    // Si response ok et pas de pattern dead = alive
    return response.ok && !isDead;
    
  } catch (error) {
    console.error(`  ⚠️  ${error.message}`);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🔍 Starting giveaway status check...\n');
  
  const data = await Bun.file('json.json').json() as GiveawayJSON;
  
  const newAlive: string[] = [];
  const newDead: string[] = [];
  
  let movedToDead = 0;
  let movedToAlive = 0;
  
  // ========== CHECK ALIVE ==========
  console.log(`📊 Checking ${data.alive.length} ALIVE giveaways...\n`);
  
  for (let i = 0; i < data.alive.length; i++) {
    const slug = data.alive[i];
    process.stdout.write(`[${i + 1}/${data.alive.length}] ${slug.padEnd(25)}... `);
    
    const isAlive = await checkGiveaway(slug);
    
    if (isAlive === true) {
      newAlive.push(slug);
      console.log('✅ ALIVE');
    } else if (isAlive === false) {
      newDead.push(slug);
      movedToDead++;
      console.log('❌ DEAD');
    } else {
      // null = erreur, on garde dans alive
      newAlive.push(slug);
      console.log('⚠️  UNKNOWN (kept alive)');
    }
    
    if (i < data.alive.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  console.log(`\n${'='.repeat(50)}\n`);
  
  // ========== CHECK DEAD (pour voir s'ils reviennent) ==========
  console.log(`📊 Checking ${data.dead.length} DEAD giveaways...\n`);
  
  for (let i = 0; i < data.dead.length; i++) {
    const slug = data.dead[i];
    process.stdout.write(`[${i + 1}/${data.dead.length}] ${slug.padEnd(25)}... `);
    
    const isAlive = await checkGiveaway(slug);
    
    if (isAlive === true) {
      newAlive.push(slug);
      movedToAlive++;
      console.log('🔄 REVIVED!');
    } else if (isAlive === false) {
      newDead.push(slug);
      console.log('💀 DEAD');
    } else {
      // null = erreur, on garde dans dead
      newDead.push(slug);
      console.log('⚠️  UNKNOWN (kept dead)');
    }
    
    if (i < data.dead.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  // ========== UPDATE JSON ==========
  const updatedData: GiveawayJSON = {
    alive: [...new Set(newAlive)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    dead: [...new Set(newDead)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  };
  
  await Bun.write('json.json', JSON.stringify(updatedData, null, 2));
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Check complete!`);
  console.log(`   Alive: ${updatedData.alive.length} (${movedToAlive > 0 ? `+${movedToAlive}` : '0'})`);
  console.log(`   Dead: ${updatedData.dead.length} (${movedToDead > 0 ? `+${movedToDead}` : '0'})`);
  console.log(`   ${movedToDead} moved to dead`);
  console.log(`   ${movedToAlive} revived to alive`);
  console.log(`${'='.repeat(50)}\n`);
  
  if (movedToDead > 0 || movedToAlive > 0) {
    console.log('🔄 JSON updated. Commit changes to trigger README update.');
  } else {
    console.log('👌 No changes detected.');
  }
}

main();
