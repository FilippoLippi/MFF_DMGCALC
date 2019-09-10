function numberWithCommas(x) {
	x = x.toFixed(0);
	var parts = x.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
}

function parseInt2(input){
	if(!input) return 0;
	return parseInt(input.toString().replace(/,/g,'')) || 0;
}
	
function ComputeDmg(userInput, job, isBroken, isWeakness, isAOE=true){	
	var dmg = userInput.ability["Attack"];
	
	// Filter out jobs that can't use the card due to jobs lore
	if(!userInput.ignoreLoreOption){
		// 1 = warrior, 2 = mage, 3 = ranger, 4 = monk
		switch(userInput.ability["Type"]){
			case "Warrior":
				if(!((job["Class"].indexOf("Graff") !== -1) || (job["Class"].indexOf("Warrior") !== -1) || (job["Lore"].indexOf("Warrior") !== -1))){
					dmg = 0;
				}
				break;
			case "Mage":
				if(!((job["Class"].indexOf("Mage") !== -1) || (job["Class"].indexOf("Meia") !== -1) || (job["Lore"].indexOf("Mage") !== -1))){
					dmg = 0;
				}
				break;
			case "Ranger":
				if(!((job["Class"].indexOf("Ranger") !== -1) || (job["Class"].indexOf("Sarah") !== -1) || (job["Lore"].indexOf("Ranger") !== -1))){
					dmg = 0;
				}
				break;
			case "Monk":
				if(!((job["Class"].indexOf("Monk") !== -1) || (job["Class"].indexOf("Sophie") !== -1) || (job["Lore"].indexOf("Monk") !== -1))){
					dmg = 0;
				}
				break;
		}
	}
	
	// TODO: Rewrite this portion of code (ugly, but works)
	if(userInput.showElementsOption){
		switch(userInput.ability["Elem"]){
			// 1 = fire, 2 = water, 3 = wind, 4 = earth, 5 = light, 6 = dark
			case 1:
				if(!(job["OrbSet1_1"] === "F" || job["OrbSet1_2"] === "F" || job["OrbSet1_3"] === "F"
					|| job["OrbSet2_1"] === "F" || job["OrbSet2_2"] === "F" || job["OrbSet2_3"] === "F")){
						dmg = 0;
				}
				break;
			case 2:
				if(!(job["OrbSet1_1"] === "W" || job["OrbSet1_2"] === "W" || job["OrbSet1_3"] === "W"
					|| job["OrbSet2_1"] === "W" || job["OrbSet2_2"] === "W" || job["OrbSet2_3"] === "W")){
						dmg = 0;
				}
				break;
			case 3:
				if(!(job["OrbSet1_1"] === "A" || job["OrbSet1_2"] === "A" || job["OrbSet1_3"] === "A"
					|| job["OrbSet2_1"] === "A" || job["OrbSet2_2"] === "A" || job["OrbSet2_3"] === "A")){
						dmg = 0;
				}
				break;
			case 4:
				if(!(job["OrbSet1_1"] === "E" || job["OrbSet1_2"] === "E" || job["OrbSet1_3"] === "E"
					|| job["OrbSet2_1"] === "E" || job["OrbSet2_2"] === "E" || job["OrbSet2_3"] === "E")){
						dmg = 0;
				}
				break;
			case 5:
				if(!(job["OrbSet1_1"] === "L" || job["OrbSet1_2"] === "L" || job["OrbSet1_3"] === "L"
					|| job["OrbSet2_1"] === "L" || job["OrbSet2_2"] === "L" || job["OrbSet2_3"] === "L")){
						dmg = 0;
				}
				break;
			case 6:
				if(!(job["OrbSet1_1"] === "D" || job["OrbSet1_2"] === "D" || job["OrbSet1_3"] === "D"
					|| job["OrbSet2_1"] === "D" || job["OrbSet2_2"] === "D" || job["OrbSet2_3"] === "D")){
						dmg = 0;
				}
				break;
		}
	}
	
	// Filter out jobs that can't use the elements

	//Output Dmg = Card's Attack * Magic * EE * Critical * Broken * Weakness * Ravage * Supreme
	//Output Dmg = Card's Attack * Attack * EE * Critical * Broken * Weakness * Ravage * Supreme
	
	if(!userInput.ability["IsMantra"]){  // true = magic, false = atk
		additional_mag = 0;
		if(userInput.isMaxReckoning && job["Reckoning"]==1){
			additional_mag += 24;
		}		
		
		mag_mod = 1;
		mag_mod += (parseInt2(userInput.ability["MultiplyMag"])/100);
		if(userInput.isCrossCounter && job["Cross Counter"] != ""){		
			mag_mod += (parseInt2(job["Cross Counter"])/100);
		}
	
		//Mag: (1 + magic_stat/100) * (1 + magic_mod/100) * (1 + stat_mod/100) + additional_magic/100		
		dmg *= ( ((1 + parseInt2(job["Magic"])/100) * mag_mod) + additional_mag);
	}
	else{
		additional_atk = 0;
		if(userInput.isMaxRetribution && job["Retribution"]==1){
			additional_atk += 24;
		}
		
		atk_mod = 1;
		atk_mod += (parseInt2(userInput.ability["MultiplyAtk"])/100);
		if(userInput.isCrossCounter && job["Cross Counter"] != ""){		
			atk_mod += (parseInt2(job["Cross Counter"])/100);
		}
		
		//Atk: (1 + attack_stat/100) * (1 + attack_mod/100) * (1 + stat_mod/100) + additional_attack/100
		dmg *= ( ((1 + parseInt2(job["Attack"])/100) * atk_mod ) + additional_atk);
	}
	
	var loreValue = 0;
	switch(curAbility["Type"]){
		case "Warrior":
			loreValue = 1;
			break;
		case "Mage":
			loreValue = 2;
			break;
		case "Ranger":
			loreValue = 3;
			break;
		case "Monk":
			loreValue = 4;
			break;
	}
	
	// EE: 1 + (enhance_element + ee_additional)/100
	switch(userInput.ability["Elem"]){
		// 1 = fire, 2 = water, 3 = wind, 4 = earth, 5 = light, 6 = dark
		case 1:
			dmg *= (1 + (parseInt2(job["Fire_EE"]) + parseInt2(job["Ability Chain"]) + userInput.ability["ElementEnhance"] + userInput.ability["AttunedChain"] + userInput.ability["AbilityChain"])/100);
			break;
		case 2:
			dmg *= (1 + (parseInt2(job["Water_EE"]) + parseInt2(job["Ability Chain"]) + userInput.ability["ElementEnhance"] + userInput.ability["AttunedChain"] + userInput.ability["AbilityChain"])/100);
			break;
		case 3:
			dmg *= (1 + (parseInt2(job["Wind_EE"]) + parseInt2(job["Ability Chain"]) + userInput.ability["ElementEnhance"] + userInput.ability["AttunedChain"] + userInput.ability["AbilityChain"])/100);
			break;
		case 4:
			dmg *= (1 + (parseInt2(job["Earth_EE"]) + parseInt2(job["Ability Chain"]) + userInput.ability["ElementEnhance"] + userInput.ability["AttunedChain"] + userInput.ability["AbilityChain"])/100);
			break;
		case 5:
			dmg *= (1 + (parseInt2(job["Light_EE"]) + parseInt2(job["Ability Chain"]) + userInput.ability["ElementEnhance"] + userInput.ability["AttunedChain"] + userInput.ability["AbilityChain"])/100);
			break;
		case 6:
			dmg *= (1 + (parseInt2(job["Dark_EE"]) + parseInt2(job["Ability Chain"]) + userInput.ability["ElementEnhance"] + userInput.ability["AttunedChain"] + userInput.ability["AbilityChain"])/100);
			break;
	}
	
	// Critical: 1 + (base_crit + imp_crit + crit_additional)/100
	dmg *= (1 + (50 + parseInt2(job["Improved Crits"]) + userInput.ability["ImprovedCrit"])/100);
	
	// Broken: 1 + (base_break + painful_break + break_additional)/100
	if(isBroken){
		dmg *= (1 + (100 + parseInt2(job["Painful Break"]) + userInput.ability["PainfulBreak"])/100);
	}
	
	// Weakness: 1 + (base_weak + broken_weak + exp_weak + weak_additional)/100
	if(isWeakness && isBroken){
		dmg *= (1 + (30 + 70 + parseInt2(job["Exploit Weakness"]) + userInput.ability["ExploitWeakness"])/100);
	}
	else if(isWeakness){
		dmg *= (1 + (30 + parseInt2(job["Exploit Weakness"]) + userInput.ability["ExploitWeakness"])/100);
	}
			
	// Ravage: 1 + (ravage + ravage_additional)/100
	if(isAOE){
		dmg *= (1 + (parseInt2(job["Ravage"]) + userInput.ability["Ravage"])/100);
	}
	
	// Supreme: 1 + (supreme_effect)/100
	dmg *= (1 + parseInt2(userInput.ability["SupremeEffect"])/100);	
	
	return dmg;
}