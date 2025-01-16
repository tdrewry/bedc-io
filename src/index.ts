import * as fs from 'fs';

type Defense = {
    type: string;
    defense: string;
}

interface CreatureClass {
    name: string;
    hitDiceValue: number;
    classLevel: number;
}

interface Item {
    name: string;
    modifier: {
        affectedObject: string;
        affectedValue: string;
        value: number;
    }
}

interface Data {
    name: string;
    level: number;
    hitPoints: number;
    tempHitPoints: number;
    classes: CreatureClass[];
    stats: Map<string, number>;
    items: Item[];
    defenses: Defense[];
}

const updateData = (data: Data): void => {
    // data.name = "Update Value";
    console.log(data);
}

function grantTempHP(character: Data, tempHP: number): Data {
    if (character.tempHitPoints < tempHP)
        character.tempHitPoints = tempHP;
    
    return character;
}

function readCharacterFromJson<T>(filePath: string): T {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to load JSON file');
    }
}

// need function process mods from items

// need function to deal damage, temp then real hp.

const filePath = './briv.json';
const data = readCharacterFromJson(filePath) as Data;
updateData(data);
grantTempHP(data, 10);