import { registerApp } from '../os/kernel';
import { consoleApp } from './console';
import { questlogApp } from './questlog';
import { bagsApp, graveApp } from './bags';
import { mailboxApp } from './mailbox';
import { codexApp, chronicleApp } from './codex';
import { calendarApp } from './calendar';
import { countdownApp } from './countdown';
import { atlasApp } from './atlas';
import { talentsApp } from './talents';
import { achievementsApp } from './achievements';
import { jukeboxApp } from './jukebox';
import { scribeApp } from './scribe';
import { abacusApp } from './abacus';
import { sweeperApp } from './sweeper';
import { chessApp } from './chess';
import { campApp } from './camp';
import { hearthApp } from './hearth';
import { galleryApp } from './gallery';
import { dungeonsApp } from './dungeons';
import { guildApp } from './guild';
import { settingsApp } from './settings';
import { armoryApp } from './armory';
import { aboutApp } from './about';
import { portalApp } from './portal';
import { newsApp } from './news';

export function registerAllApps() {
  [countdownApp, newsApp, codexApp, chronicleApp, questlogApp, atlasApp, dungeonsApp, hearthApp, achievementsApp,
    bagsApp, graveApp, scribeApp, calendarApp, abacusApp, campApp, portalApp,
    mailboxApp, guildApp, jukeboxApp, armoryApp,
    sweeperApp, chessApp,
    consoleApp, talentsApp, settingsApp, galleryApp, aboutApp].forEach(registerApp);
}
