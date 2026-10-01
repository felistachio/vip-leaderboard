import { fetchUpdates, readCurrentData } from "./data-fetch";
import { appendData, saveData } from "./data-save";
import { countActivities } from "./scoring";

const isUpdate = process.argv[2] === "update";

(isUpdate ? fetchUpdates : readCurrentData)()
	.then(countActivities)
	.then(isUpdate ? appendData : saveData);
