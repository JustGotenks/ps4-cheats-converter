const createDownloadLink = (strContents, filename) => {
  const blob = new Blob([strContents], {type: 'text/plain'});
  const tempLink = document.createElement('a');
  tempLink.setAttribute('href', URL.createObjectURL(blob));
  tempLink.setAttribute('download', filename);
  return tempLink;
}

const goldHenFilename = (jsonObj) => {
  const process = jsonObj.process==='eboot.bin' ? '' : `_${jsonObj.process}`;
  const cusa = jsonObj.id;
  const version = jsonObj.version;
  return `${cusa}_${version}${process}.json`;
}

const shnFilename = (shnStr) => {
  const xmlDoc = (new DOMParser()).parseFromString(shnStr, 'text/xml');
  const trainerEle = xmlDoc.querySelector('Trainer');
  const game = trainerEle.attributes['Game'].value.replaceAll(/[^\w\d]/g, '');
  const creator = trainerEle.attributes['Moder'].value;
  const cusa = trainerEle.attributes['Cusa'].value;
  const version = trainerEle.attributes['Version'].value;
  const FWv = document.getElementById('fwv').value || '9.00';
  return `${game}_${cusa}_${version}_${creator}_${FWv}.shn`;
}

const addOffset = (offsetStr) => (parseInt(offsetStr, 16) + 0x400000).toString(16).toUpperCase();
const subOffset = (offsetStr) => (parseInt(offsetStr, 16) - 0x400000).toString(16).toUpperCase();
const addLines = (noLines) => noLines.match(/.{2}/g).join('-');
const onlyHex = (str) => str.replaceAll(/[^a-zA-Z0-9]/g, '');




const toSHN = (jsonObj, toSubOffset=false) => {
  const genre = document.getElementById('genre').value || 'Adventure';

  let xmlStr =`<?xml version="1.0" encoding="utf-16"?>
<Trainer xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Game="${jsonObj.name}" Moder="${jsonObj.credits.join(', ')}" Cusa="${jsonObj.id}" Version="${jsonObj.version}" Process="${jsonObj.process}">
  <Genres Name="${genre}" />
  <Items />`;

  let cheats = ''
  jsonObj.mods.forEach(jMod => {
    cheats += `\n  <Cheat Text="${jMod.name}">\n`;
    jMod.memory.forEach(jMem => {
      cheats += `    <Cheatline>
      <Offset>${toSubOffset ? subOffset(jMem.offset) : jMem.offset}</Offset>
      <Section>0</Section>
      <ValueOn>${addLines(jMem.on)}</ValueOn>
      <ValueOff>${addLines(jMem.off)}</ValueOff>
    </Cheatline>\n`
    });
    cheats += `  </Cheat>`
  });
  xmlStr += cheats + '\n</Trainer>';

  return xmlStr;
}

const changeJsonOffset = (jObj, toAddOffset=false) => {
  const jsonObj = Object.assign({}, jObj);
  jsonObj.mods.forEach((_, i, modArr) => {
    modArr[i].memory.forEach((mem, j, memArr) => {
      memArr[j].offset = toAddOffset ? addOffset(mem.offset) : subOffset(mem.offset);
    });
  });
  return jsonObj;
}


const shnToJson = () => {
  const xmlStr = document.querySelector('#SHN textarea').value;
  const xmlDoc = (new DOMParser()).parseFromString(xmlStr, 'text/xml');
  const trainerEle = xmlDoc.querySelector('Trainer');
  const jsonObj = {
    name: trainerEle.attributes['Game'].value,
    id: trainerEle.attributes['Cusa'].value,
    version: trainerEle.attributes['Version'].value,
    process: trainerEle.attributes['Process'].value,
    mods: [],
    credits: trainerEle.attributes['Moder'].value.split(/\, ?/g)
  };
  const cheats = xmlDoc.querySelectorAll('Cheat');
  cheats.forEach(cheat => {
    const mod = {
      name: cheat.attributes['Text'].value,
      type: 'checkbox',
      memory: []
    };
    cheat.querySelectorAll('Cheatline').forEach(cheatline => {
      const mem = {
        offset: cheatline.querySelector('Offset').textContent,
        on: onlyHex(cheatline.querySelector('ValueOn').textContent),
        off: onlyHex(cheatline.querySelector('ValueOff').textContent)
      };
      mod['memory'].push(mem);
    });
    jsonObj['mods'].push(mod);
  });
  return jsonObj;
}


const setOG = (jsonObj) => {
  document.querySelector('#OG textarea').value = JSON.stringify(jsonObj, null, 2);
  document.querySelector('#OG p').textContent = goldHenFilename(jsonObj);
}
const setGoldHEN = (jsonObj) => {
  document.querySelector('#GoldHEN textarea').value = JSON.stringify(jsonObj, null, 2);
  document.querySelector('#GoldHEN p').textContent = goldHenFilename(jsonObj);
}
const setSHN = (shnStr) => {
  document.querySelector('#SHN textarea').value = shnStr;
  document.querySelector('#SHN p').textContent = shnFilename(shnStr);
}


const convertOG = (toType) => {
  const jsonObj = JSON.parse(document.querySelector('#OG textarea').value);
  switch (toType) {
  case 'GoldHEN':
    setGoldHEN(changeJsonOffset(jsonObj));
    break;
  case 'SHN':
    setSHN(toSHN(jsonObj, true));
    break;
  default:
    setGoldHEN(changeJsonOffset(jsonObj));
    setSHN(toSHN(jsonObj));
    break;
  }
}

const convertGoldHEN = (toType) => {
  const jsonObj = JSON.parse(document.querySelector('#GoldHEN textarea').value);
  switch (toType) {
  case 'OG':
    setOG(changeJsonOffset(jsonObj, true));
    break;
  case 'SHN':
    setSHN(toSHN(jsonObj));
    break;
  default:
    setOG(changeJsonOffset(jsonObj, true));
    setSHN(toSHN(jsonObj, true));
    break;
  }
}

const convertSHN = (toType) => {
  const jsonObj = shnToJson();
  switch (toType) {
  case 'OG':
    setOG(changeJsonOffset(jsonObj, true));
    break;
  case 'GoldHEN':
    setGoldHEN(jsonObj);
    break;
  default:
    setGoldHEN(jsonObj);
    setOG(changeJsonOffset(jsonObj, true));
    break;
  }
}


document.getElementById('OG-to-GoldHEN').onclick = () => convertOG('GoldHEN');
document.getElementById('OG-to-both').onclick = () => convertOG('both');
document.getElementById('OG-to-SHN').onclick = () => convertOG('SHN');

document.getElementById('GoldHEN-to-OG').onclick = () => convertGoldHEN('OG');
document.getElementById('GoldHEN-to-both').onclick = () => convertGoldHEN('both');
document.getElementById('GoldHEN-to-SHN').onclick = () => convertGoldHEN('SHN');

document.getElementById('SHN-to-OG').onclick = () => convertSHN('OG');
document.getElementById('SHN-to-both').onclick = () => convertSHN('both');
document.getElementById('SHN-to-GoldHEN').onclick = () => convertSHN('GoldHEN');



const ogButtonDL = document.querySelector('#OG .DL-line button');
ogButtonDL.onclick = () => {
  const jsonStr = document.querySelector('#OG textarea').value;
  const jsonObj = JSON.parse(jsonStr);
  const filename = goldHenFilename(jsonObj);
  const downloadLink = createDownloadLink(jsonStr, filename);
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);
}

const goldHenButtonDL = document.querySelector('#GoldHEN .DL-line button');
goldHenButtonDL.onclick = () => {
  const jsonStr = document.querySelector('#GoldHEN textarea').value;
  const jsonObj = JSON.parse(jsonStr);
  const filename = goldHenFilename(jsonObj);
  const downloadLink = createDownloadLink(jsonStr, filename);
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);
}

const shnButtonDL = document.querySelector('#SHN .DL-line button');
shnButtonDL.onclick = () => {
  const xmlStr = document.querySelector('#SHN textarea').value;
  const filename = shnFilename(xmlStr);
  const downloadLink = createDownloadLink(xmlStr, filename);
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);
}


const clear = (choice) => document.querySelector(`#${choice} textarea`).value = '';
document.querySelector('#OG .clear button').onclick = () => clear('OG');
document.querySelector('#GoldHEN .clear button').onclick = () => clear('GoldHEN');
document.querySelector('#SHN .clear button').onclick = () => clear('SHN');
document.querySelector('#GoldHEN .clearAll button').onclick = () => {
  ['OG', 'GoldHEN', 'SHN'].forEach(choice => clear(choice));
};