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
        {{ loading ? "Loading..." : "No records found" }}
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

<script setup lang="ts">
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
import type {
  DataTablePageEvent,
  DataTableFilterEvent
} from "primevue/datatable";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type DataTable from "primevue/datatable";

const dt = ref<InstanceType<typeof DataTable> | null>(null);

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
const data = ref<DocumentData[]>([]);
const rowNum = 10;
const totalRecords = ref(0);
const loading = ref(false);
const filters = ref({
  name: { value: null, matchMode: FilterMatchMode.EQUALS },
  summary: { value: null, matchMode: FilterMatchMode.EQUALS },
  createdAt: { value: null, matchMode: FilterMatchMode.BETWEEN }
});

let currQuery = generateDatatableQueryByFilters(props.collectionName);
let cursors = <QueryDocumentSnapshot[]>[];

// Data lazy load handler
const reload = () => {
  cursors = [];
  totalRecords.value = 0;
  return lazyLoad();
};

// Lazy load data
const lazyLoad = async (event?: DataTablePageEvent) => {
  loading.value = true;
  try {
    const { page = 0, rows = rowNum } = event || {};

    // Fetch total count only once
    if (page === 0 && totalRecords.value === 0) {
      totalRecords.value = await getTotalCount(currQuery!);
    }

    // Fetch data for the current page
    const { data: newData, cursors: newCursors } = await fetchByPage(
      page,
      currQuery!,
      rows,
      cursors
    );

    data.value = newData;
    first.value = page * rows;
    cursors = newCursors;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: `Error loading record: ${message}`,
      life: 1000
    });
  } finally {
    loading.value = false;
  }
};

// Filter handler
const onFilter = (event: DataTableFilterEvent) => {
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
  exportCSV(currQuery!, "records.csv");
};

// Confirm delete handler
const confirmDelete = (
  event: MouseEvent,
  record: RecipeEntity | CourseEntity
) => {
  if (!record || !record.id) return;
  // Show confirmation dialog
  confirm.require({
    target: event.currentTarget as HTMLElement,
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
        const message = err instanceof Error ? err.message : String(err);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: `Error: ${message}`,
          life: 1000
        });
      } finally {
        loading.value = false;
      }
    }
  });
};

// Update table record
const updateRecord = (id: string, updatedFields: Record<string, any>) => {
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
  const rootEl = (dt.value as any)?.$el as HTMLElement | undefined;
  rootEl?.querySelector(".p-paginator-prev")?.setAttribute("tabindex", "0");
  rootEl?.querySelector(".p-paginator-next")?.setAttribute("tabindex", "0");
});
</script>
