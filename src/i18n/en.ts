export const en = {
	"settings.title": "Travel Planner",

	"settings.tripsFolder.name": "Trips folder",
	"settings.tripsFolder.desc":
		"Where new trip notes are created. Set this to enable creating trips and a trips overview.",

	"settings.catalog.heading": "Item catalog",
	"settings.catalog.desc":
		'The catalog is read live from a folder of item notes — one note per item — rather than stored in plugin settings. Set a folder below to enable it; until then, packing lists are generated empty. Each note needs a "travel-planner-name" and a "travel-planner-category" frontmatter property (fixed field names, not configurable) — the category can be a single value or a list, since an item can belong to more than one. Add, edit, or delete notes in that folder (or use the "Create Packing Item Note" command) to change what\'s available.',

	"settings.catalogFolder.name": "Catalog folder",
	"settings.catalogFolder.desc": "Folder containing one note per catalog item.",

	"settings.categories.heading": "Categories",
	"settings.categories.desc":
		"Controls display order when generating a packing list. Any category found in the catalog but missing here is still included, appended at the end.",
	"settings.categories.addName": "Add category",
	"settings.categories.addPlaceholder": "e.g. Camping",
	"settings.categories.addButton": "Add",
	"settings.categories.removeTooltip": "Remove",
	"settings.categories.editHint": "Click to edit name and color",

	"settings.packingColumns.heading": "Packing status columns",
	"settings.packingColumns.desc":
		"Yes/No or Number columns (e.g. Packed, Bought) shown in every trip's generated packing table, alongside a fixed Quantity column (how many of the item the trip needs). Each becomes an editable column in the table — a checkbox for Yes/No, a number field for Number — updating that item's note directly. A column's type can't be changed after creation; remove and re-add it instead.",
	"settings.packingColumns.addName": "Add column",
	"settings.packingColumns.addPlaceholder": "e.g. Bought",
	"settings.packingColumns.typeBoolean": "Yes/No",
	"settings.packingColumns.typeNumber": "Number",

	"command.createTrip": "Create Trip with Packing List",
	"command.insertPackingList": "Insert Packing List into Current Note",
	"command.resetPackingList": "Reset Packing List in Current Note",
	"command.createPackingItem": "Create Packing Item Note",
	"command.createTripsOverview": "Create Trips Overview",
	"command.createCatalogOverview": "Create Catalog Overview",
	"command.createExampleData": "Create Example Data",

	"modal.tripName.title": "Trip name",
	"modal.tripName.placeholder": "e.g. Lisbon 2026",
	"modal.tripName.button": "Next",

	"modal.category.title": "Categories",
	"modal.category.placeholder": "e.g. Clothing, Sport",
	"modal.category.button": "Add Item",

	"modal.itemName.title": "Item name",
	"modal.itemName.placeholder": "e.g. Sunscreen",
	"modal.itemName.button": "Next",

	"modal.categoryPicker.title": "Select categories to include",
	"modal.categoryPicker.button": "Create",

	"modal.editCategory.title": "Edit category",
	"modal.editCategory.nameLabel": "Name",
	"modal.editCategory.colorLabel": "Color",
	"modal.editCategory.save": "Save",

	"notice.noActiveFile": "No active file.",
	"notice.tripExists": '"{{name}}" already exists in {{folder}}.',
	"notice.tripCreated": "Created trip: {{name}}",
	"notice.packingListInserted": "Packing list inserted.",
	"notice.noPackingList": "No packing list found in this note.",
	"notice.packingListReset": "Packing list reset.",
	"notice.itemExists": '"{{name}}" already exists in {{folder}}.',
	"notice.itemAdded": 'Added "{{name}}" to the catalog.',
	"notice.tripsOverviewExists": "A Trips Overview base already exists in {{folder}}.",
	"notice.tripsOverviewCreated": "Created Trips Overview in {{folder}}.",
	"notice.catalogOverviewExists": "A Catalog Overview base already exists in {{folder}}.",
	"notice.catalogOverviewCreated": "Created Catalog Overview in {{folder}}.",
	"notice.catalogNotConfigured": "Set a catalog folder in Travel Planner settings first.",
	"notice.tripsFolderNotConfigured": "Set a trips folder in Travel Planner settings first.",
	"notice.exampleDataCreated": "Created {{items}} example catalog item(s). Opened Example Trip.",
	"notice.categoryExists": 'A category named "{{name}}" already exists.',
} as const;
