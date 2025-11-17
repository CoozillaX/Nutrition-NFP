<template>
  <!-- Toolbar -->
  <Toolbar>
    <template #start>
      <h2 class="font-bold text-xl">{{ title }} Manager</h2>
    </template>
    <template #end>
      <Button
        label="New"
        icon="pi pi-plus"
        class="mr-2"
        tabindex="0"
        @click="onModalOpen()"
      ></Button>
      <Button
        label="Export"
        icon="pi pi-upload"
        severity="secondary"
        tabindex="0"
        @click="onExportCSV"
      ></Button>
    </template>
  </Toolbar>
  <!-- DataTable -->
  <DataTable
    ref="dt"
    tableStyle="min-width: 50rem"
    filterDisplay="row"
    lazy
    paginator
    :first="first"
    :value="data"
    :rows="rowNum"
    :totalRecords="totalRecords"
    :loading="loading"
    :filters="filters"
    @page="lazyLoad"
    @filter="onFilter"
  >
    <template #empty>
      <div class="text-center">
        {{ loading ? 'Loading...' : 'No records found' }}
      </div>
    </template>
    <template #loading>
      <ProgressSpinner aria-label="Loading" />
    </template>
    <Column header="Image">
      <template #body="slotProps">
        <Image
          width="96"
          height="96"
          preview
          :src="slotProps.data.imageUrl"
        ></Image>
      </template>
    </Column>
    <Column
      field="name"
      header="Name"
      :showFilterMenu="true"
      :filterMatchModeOptions="[
        { label: 'Equals', value: FilterMatchMode.EQUALS }
      ]"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          placeholder="Filter by name"
          fluid
          @blur="filterCallback"
        />
      </template>
    </Column>
    <Column
      field="summary"
      header="Summary"
      :showFilterMenu="true"
      :filterMatchModeOptions="[
        { label: 'Equals', value: FilterMatchMode.EQUALS }
      ]"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          placeholder="Filter by summary"
          fluid
          @blur="filterCallback"
        />
      </template>
    </Column>
    <Column
      field="createdAt"
      header="Created At"
      :showFilterMenu="true"
      :filterMatchModeOptions="[
        { label: 'Between', value: FilterMatchMode.BETWEEN }
      ]"
    >
      <template #body="slotProps">
        {{ formatDate(slotProps.data.createdAt.toDate()) }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <DatePicker
          v-model="filterModel.value"
          selection-mode="range"
          date-format="yy-mm-dd"
          placeholder="Filter by date"
          :show-icon="true"
          fluid
          @date-select="filterCallback"
        />
      </template>
    </Column>
    <Column style="width: 10rem">
      <template #body="slotProps">
        <Button
          type="button"
          icon="pi pi-pencil"
          severity="success"
          tabindex="0"
          rounded
          @click="() => onModalOpen(slotProps.data)"
        ></Button>
        <Button
          type="button"
          icon="pi pi-trash"
          severity="danger"
          class="ms-2"
          tabindex="0"
          rounded
          @click="(event) => confirmDelete(event, slotProps.data)"
        ></Button>
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { FilterMatchMode } from "@primevue/core/api";
import {
  generateDatatableQueryByFilters,
  fetchByPage,
  getTotalCount,
  exportCSV
} from "@/firestore/utils";
import { formatDate } from "@/utils/date";

const dt = ref(null);

// Props
const props = defineProps({
  title: {
    type: String,
    default: "Manager"
  },
  collectionName: {
    type: String,
    required: true
  },
  recordDeleteFunc: {
    type: Function,
    required: true
  },
  onModalOpen: {
    type: Function,
    required: true
  }
});

// Toast and Confirm
const toast = useToast();
const confirm = useConfirm();

// DataTable state
const first = ref(0);
const data = ref([]);
const rowNum = 10;
const totalRecords = ref(0);
const loading = ref(false);
const filters = ref({
  name: { value: null, matchMode: FilterMatchMode.EQUALS },
  summary: { value: null, matchMode: FilterMatchMode.EQUALS },
  createdAt: { value: null, matchMode: FilterMatchMode.BETWEEN }
});

let currQuery = generateDatatableQueryByFilters(props.collectionName, null);
let cursors = [];

// Data lazy load handler
const reload = async () => {
  cursors = [];
  totalRecords.value = 0;
  await lazyLoad();
};

const lazyLoad = async (event) => {
  loading.value = true;
  try {
    const { page = 0, rows = rowNum } = event?.originalEvent || {};

    // Fetch total count only once
    if (page === 0 && totalRecords.value === 0) {
      totalRecords.value = await getTotalCount(currQuery);
    }

    // Fetch data for the current page
    const { data: newData, cursors: newCursors } = await fetchByPage(
      page,
      currQuery,
      rows,
      cursors
    );

    data.value = newData;
    first.value = page * rows;
    cursors = newCursors;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error loading record: ${error.message}`,
      life: 1000
    });
  } finally {
    loading.value = false;
  }
};

// Filter handler
const onFilter = (event) => {
  const { filters } = event || {};
  if (filters) {
    const newQuery = generateDatatableQueryByFilters(
      props.collectionName,
      filters
    );
    if (!newQuery) return; // Invalid state, do nothing
    currQuery = newQuery;
    reload();
  }
};

// Export CSV handler
const onExportCSV = () => {
  exportCSV(currQuery, 'records.csv');
}

// Confirm delete handler
const confirmDelete = (event, record) => {
  if (!record || !record.id) return;
  // Show confirmation dialog
  confirm.require({
    target: event.currentTarget,
    message: "Do you want to delete this record?",
    icon: "pi pi-info-circle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true
    },
    acceptProps: {
      label: "Delete",
      severity: "danger"
    },
    accept: async () => {
      loading.value = true;
      try {
        await props.recordDeleteFunc(record);
        toast.add({
          severity: "success",
          summary: "Success",
          detail: "Record deleted successfully!",
          life: 1000
        });

        await reload();
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Error: ${err.message}`,
          life: 1000
        });
      } finally {
        loading.value = false;
      }
    }
  });
};

// Update table record
const updateRecord = (id, updatedFields) => {
  const index = data.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    data.value[index] = { ...data.value[index], ...updatedFields };
  }
};

// Expose methods to parent
defineExpose({
  reload,
  updateRecord
});

// Initial load
onMounted(() => {
  reload();
  dt.value?.$el?.querySelector(".p-paginator-prev")?.setAttribute("tabindex", "0");
  dt.value?.$el?.querySelector(".p-paginator-next")?.setAttribute("tabindex", "0");
});
</script>
