import type { UiLanguage } from '../types/analytics';

export type MessageKey =
  | 'title'
  | 'subtitle'
  | 'comparisonNav'
  | 'myPathNav'
  | 'profileNav'
  | 'companiesNav'
  | 'settingsNav'
  | 'profileTitle'
  | 'profileSubtitle'
  | 'myPathTitle'
  | 'myPathSubtitle'
  | 'people'
  | 'companies'
  | 'company'
  | 'companyPeriod'
  | 'compensationUnit'
  | 'hourlyUnit'
  | 'monthlyUnit'
  | 'comparisonMode'
  | 'metric'
  | 'bonusMode'
  | 'bonusesOff'
  | 'bonusesOn'
  | 'language'
  | 'theme'
  | 'collapseSidebar'
  | 'expandSidebar'
  | 'lightMode'
  | 'darkMode'
  | 'projection'
  | 'projectionYears'
  | 'projectionAnnualRaise'
  | 'projectionActive'
  | 'projectionInactive'
  | 'projectionReset'
  | 'calendarMode'
  | 'tenureMode'
  | 'rateMetric'
  | 'incomeMetric'
  | 'pathMetricNormalizedRate'
  | 'pathMetricIncome'
  | 'kpiCurrentRate'
  | 'kpiAnnualSalary'
  | 'kpiAnnualSalaryWithBonus'
  | 'kpiMonthlySalary'
  | 'kpiMonthlySalaryWithBonus'
  | 'kpiTotalIncome'
  | 'kpiTotalIncomeWithBonus'
  | 'kpiMarketGap'
  | 'kpiTenure'
  | 'tablePerson'
  | 'tableRate'
  | 'tableRateAligned'
  | 'tableIncome'
  | 'tableIncomeAligned'
  | 'tableIncomeProjected'
  | 'tableGap'
  | 'tableGapAligned'
  | 'tableGapProjected'
  | 'tableTenure'
  | 'tableLastEvent'
  | 'tableReferenceDate'
  | 'tableProjectionDate'
  | 'tableYear'
  | 'tableAnnualBase'
  | 'tableBonus'
  | 'tableAnnualTotal'
  | 'tableMonthlyBase'
  | 'tableMonthlyTotal'
  | 'tableTenureHint'
  | 'tableProjectionHint'
  | 'projectionBonusNote'
  | 'tableRateProjected'
  | 'startCompensation'
  | 'endCompensation'
  | 'growthAbsolute'
  | 'growthPercent'
  | 'growthNormalizedHourly'
  | 'totalIncomeByCompany'
  | 'personalScore'
  | 'normalization'
  | 'normalizationEstimated'
  | 'normalizationExact'
  | 'monthlyHours'
  | 'selectedUsers'
  | 'summary'
  | 'drawerTitle'
  | 'close'
  | 'startDate'
  | 'careerEvents'
  | 'eventType'
  | 'eventDate'
  | 'eventRate'
  | 'openUserDetailHint'
  | 'raiseEvent'
  | 'effectiveDate'
  | 'futureInputTitle'
  | 'futureInputBody'
  | 'na'
  | 'chartLegendTitle'
  | 'pathChartLegendTitle'
  | 'years'
  | 'days'
  | 'perHour'
  | 'perMonth'
  | 'showManagement'
  | 'hideManagement'
  | 'signOut'
  | 'wizardTitle'
  | 'wizardSubtitle'
  | 'wizardCurrentCompany'
  | 'wizardCompanyName'
  | 'wizardCompanyNamePlaceholder'
  | 'wizardCompanyStartDate'
  | 'wizardCompensationType'
  | 'wizardHourlyRate'
  | 'wizardMonthlySalary'
  | 'wizardInitialRate'
  | 'wizardCurrentRate'
  | 'wizardCurrentRole'
  | 'wizardCurrentRolePlaceholder'
  | 'wizardWorkSettings'
  | 'wizardMonthlyHours'
  | 'wizardWorkingDays'
  | 'wizardCurrency'
  | 'wizardYourColor'
  | 'wizardHint'
  | 'wizardSubmit'
  | 'wizardSubmitting'
  | 'companiesTitle'
  | 'companiesSubtitle'
  | 'companiesCol'
  | 'eventsCol'
  | 'detailsCol'
  | 'addBtn'
  | 'cancelBtn'
  | 'createBtn'
  | 'saveChanges'
  | 'deleteEvent'
  | 'deleteCompany'
  | 'noCompaniesYet'
  | 'noEventsYet'
  | 'selectCompany'
  | 'selectEventHint'
  | 'companyNameLabel'
  | 'colorLabel'
  | 'endDateLabel'
  | 'endDateHint'
  | 'scoreLabel'
  | 'companyPeriodLabel'
  | 'companyCurrentLabel'
  | 'companyPreviousLabel'
  | 'initialCompensationLabel'
  | 'compensationUnitWarning'
  | 'compensationUnitConfirm'
  | 'eventTypeLabel'
  | 'dateLabel'
  | 'amountLabel'
  | 'titleRoleLabel'
  | 'addEvent'
  | 'present'
  | 'evtStart'
  | 'evtRaise'
  | 'evtAnnualRaise'
  | 'evtMidYearRaise'
  | 'evtPromotion'
  | 'evtCompanyChange'
  | 'evtKnownCompensation'
  | 'companyCreatedSuccess'
  | 'companyCreatedError'
  | 'companyUpdatedSuccess'
  | 'companyUpdatedError'
  | 'companyDeletedSuccess'
  | 'companyDeletedError'
  | 'eventCreatedSuccess'
  | 'eventCreatedError'
  | 'eventUpdatedSuccess'
  | 'eventUpdatedError'
  | 'eventDeletedSuccess'
  | 'eventDeletedError'
  | 'settingsTitle'
  | 'settingsSubtitle'
  | 'settingsDataSection'
  | 'settingsResetTitle'
  | 'settingsResetDescription'
  | 'settingsResetButton'
  | 'settingsResetting'
  | 'settingsResetConfirm';

const messages: Record<UiLanguage, Record<MessageKey, string>> = {
  es: {
    title: 'Salary Path',
    subtitle: 'Proyeccion salarial y comparacion entre perfiles',
    comparisonNav: 'Comparacion',
    myPathNav: 'Mi ruta',
    profileNav: 'Perfil',
    companiesNav: 'Empresas',
    settingsNav: 'Ajustes',
    profileTitle: 'Perfil',
    profileSubtitle: 'Detalle salarial personal',
    myPathTitle: 'Mi trayectoria',
    myPathSubtitle: 'Evolucion salarial por empresa y comparacion de crecimiento',
    people: 'Personas',
    companies: 'Empresas',
    company: 'Empresa',
    companyPeriod: 'Periodo',
    compensationUnit: 'Unidad',
    hourlyUnit: 'Por hora',
    monthlyUnit: 'Mensual',
    comparisonMode: 'Comparacion',
    metric: 'Metrica',
    bonusMode: 'Bonos',
    bonusesOff: 'Sin bonos',
    bonusesOn: 'Incluir bonos',
    language: 'Idioma',
    theme: 'Tema',
    collapseSidebar: 'Minimizar barra lateral',
    expandSidebar: 'Expandir barra lateral',
    lightMode: 'Claro',
    darkMode: 'Oscuro',
    projection: 'Proyeccion',
    projectionYears: 'Horizonte (años)',
    projectionAnnualRaise: 'Aumento anual (USD/h)',
    projectionActive: 'Proyeccion activa',
    projectionInactive: 'Sin proyeccion',
    projectionReset: 'Reiniciar proyeccion',
    calendarMode: 'Calendario',
    tenureMode: 'Antiguedad',
    rateMetric: 'Tarifa (USD/h)',
    incomeMetric: 'Ingreso acumulado',
    pathMetricNormalizedRate: 'Tarifa normalizada (USD/h)',
    pathMetricIncome: 'Ingreso acumulado',
    kpiCurrentRate: 'Tarifa actual',
    kpiAnnualSalary: 'Salario anual',
    kpiAnnualSalaryWithBonus: 'Salario anual + bonos',
    kpiMonthlySalary: 'Salario mensual',
    kpiMonthlySalaryWithBonus: 'Salario mensual + bonos',
    kpiTotalIncome: 'Ingreso total',
    kpiTotalIncomeWithBonus: 'Ingreso total + bonos',
    kpiMarketGap: 'Brecha al mercado',
    kpiTenure: 'Antiguedad',
    tablePerson: 'Persona',
    tableRate: 'Tarifa actual',
    tableRateAligned: 'Tarifa alineada',
    tableIncome: 'Ingreso total',
    tableIncomeAligned: 'Ingreso alineado',
    tableIncomeProjected: 'Ingreso proyectado',
    tableGap: 'Brecha',
    tableGapAligned: 'Brecha alineada',
    tableGapProjected: 'Brecha proyectada',
    tableTenure: 'Antiguedad',
    tableLastEvent: 'Ultimo evento',
    tableReferenceDate: 'Fecha de referencia',
    tableProjectionDate: 'Fecha proyectada',
    tableYear: 'Año',
    tableAnnualBase: 'Base anual',
    tableBonus: 'Bonos',
    tableAnnualTotal: 'Total anual',
    tableMonthlyBase: 'Base mensual',
    tableMonthlyTotal: 'Total mensual',
    tableTenureHint: 'Comparacion alineada por antiguedad',
    tableProjectionHint: 'Resumen con proyeccion aplicada',
    projectionBonusNote: 'En proyeccion no se consideran bonos.',
    tableRateProjected: 'Tarifa proyectada',
    startCompensation: 'Compensacion inicial',
    endCompensation: 'Compensacion final',
    growthAbsolute: 'Crecimiento bruto',
    growthPercent: 'Crecimiento %',
    growthNormalizedHourly: 'Crecimiento normalizado (USD/h)',
    totalIncomeByCompany: 'Ingreso total por empresa',
    personalScore: 'Puntuacion personal',
    normalization: 'Normalizacion',
    normalizationEstimated: 'Estimada',
    normalizationExact: 'Exacta',
    monthlyHours: 'Horas/mes',
    selectedUsers: 'Usuarios seleccionados',
    summary: 'Resumen',
    drawerTitle: 'Detalle de usuario',
    close: 'Cerrar',
    startDate: 'Fecha de inicio',
    careerEvents: 'Eventos de carrera',
    eventType: 'Tipo',
    eventDate: 'Fecha',
    eventRate: 'Tarifa',
    openUserDetailHint: 'Haz clic para ver el detalle completo del usuario',
    raiseEvent: 'Aumento de tarifa',
    effectiveDate: 'Vigente desde',
    futureInputTitle: 'Proximamente',
    futureInputBody: 'Usa el panel de gestion para crear y editar tu historial profesional y financiero.',
    na: 'N/A',
    chartLegendTitle: 'Detalle',
    pathChartLegendTitle: 'Trayectoria',
    years: 'años',
    days: 'dias',
    perHour: '/h',
    perMonth: '/mes',
    showManagement: 'Mostrar gestion',
    hideManagement: 'Ocultar gestion',
    signOut: 'Cerrar sesion',
    wizardTitle: 'Bienvenido a Salary Path',
    wizardSubtitle: 'Configura tu perfil profesional para comenzar',
    wizardCurrentCompany: 'Empresa actual',
    wizardCompanyName: 'Nombre de la empresa',
    wizardCompanyNamePlaceholder: 'ej. Acme Corp',
    wizardCompanyStartDate: 'Fecha de inicio en esta empresa',
    wizardCompensationType: 'Tipo de compensacion',
    wizardHourlyRate: 'Tarifa por hora',
    wizardMonthlySalary: 'Salario mensual',
    wizardInitialRate: 'al ingresar',
    wizardCurrentRate: 'actual',
    wizardCurrentRole: 'Rol actual (opcional)',
    wizardCurrentRolePlaceholder: 'ej. Software Engineer',
    wizardWorkSettings: 'Configuracion laboral',
    wizardMonthlyHours: 'Horas/mes',
    wizardWorkingDays: 'Dias laborales/año',
    wizardCurrency: 'Moneda',
    wizardYourColor: 'Tu color',
    wizardHint: 'Podras agregar empresas anteriores y eventos de carrera detallados desde la pestaña Empresas.',
    wizardSubmit: 'Iniciar mi Career Path',
    wizardSubmitting: 'Configurando...',
    companiesTitle: 'Empresas y eventos de carrera',
    companiesSubtitle: 'Gestiona tu linea de tiempo profesional',
    companiesCol: 'Empresas',
    eventsCol: 'Eventos',
    detailsCol: 'Detalles',
    addBtn: '+ Agregar',
    cancelBtn: 'Cancelar',
    createBtn: 'Crear',
    saveChanges: 'Guardar cambios',
    deleteEvent: 'Eliminar evento',
    deleteCompany: 'Eliminar empresa',
    noCompaniesYet: 'Sin empresas aun',
    noEventsYet: 'Sin eventos aun',
    selectCompany: 'Selecciona una empresa',
    selectEventHint: 'Selecciona un evento para ver detalles, o una empresa para editarla',
    companyNameLabel: 'Nombre de empresa',
    colorLabel: 'Color',
    endDateLabel: 'Fecha de fin',
    endDateHint: 'Dejar vacio si es la empresa actual',
    scoreLabel: 'Puntuacion personal (0-10)',
    companyPeriodLabel: 'Tipo de empresa',
    companyCurrentLabel: 'Actual',
    companyPreviousLabel: 'Anterior',
    initialCompensationLabel: 'Sueldo inicial',
    compensationUnitWarning: 'Cambiar la unidad afectara todos los sueldos registrados en esta empresa.',
    compensationUnitConfirm: 'Cambiar la unidad afectara todos los sueldos registrados en esta empresa. ¿Estas seguro?',
    eventTypeLabel: 'Tipo de evento',
    dateLabel: 'Fecha',
    amountLabel: 'Monto',
    titleRoleLabel: 'Titulo / rol',
    addEvent: 'Agregar evento',
    present: 'presente',
    evtStart: 'Inicio',
    evtRaise: 'Aumento',
    evtAnnualRaise: 'Aumento anual',
    evtMidYearRaise: 'Aumento semestral',
    evtPromotion: 'Promocion',
    evtCompanyChange: 'Cambio de empresa',
    evtKnownCompensation: 'Compensacion conocida',
    companyCreatedSuccess: 'Empresa creada correctamente.',
    companyCreatedError: 'No se pudo crear la empresa.',
    companyUpdatedSuccess: 'Empresa actualizada correctamente.',
    companyUpdatedError: 'No se pudo actualizar la empresa.',
    companyDeletedSuccess: 'Empresa eliminada correctamente.',
    companyDeletedError: 'No se pudo eliminar la empresa.',
    eventCreatedSuccess: 'Evento agregado correctamente.',
    eventCreatedError: 'No se pudo agregar el evento.',
    eventUpdatedSuccess: 'Evento actualizado correctamente.',
    eventUpdatedError: 'No se pudo actualizar el evento.',
    eventDeletedSuccess: 'Evento eliminado correctamente.',
    eventDeletedError: 'No se pudo eliminar el evento.',
    settingsTitle: 'Ajustes',
    settingsSubtitle: 'Administra tu cuenta y datos',
    settingsDataSection: 'Gestion de datos',
    settingsResetTitle: 'Reiniciar todos los datos',
    settingsResetDescription: 'Eliminar permanentemente todas tus empresas, eventos de carrera y configuracion. Seras redirigido al wizard inicial para comenzar de nuevo.',
    settingsResetButton: 'Eliminar datos y reiniciar',
    settingsResetting: 'Eliminando...',
    settingsResetConfirm: 'Esto eliminara permanentemente TODOS tus datos (empresas, eventos, configuracion) y reiniciara el wizard. Esta accion no se puede deshacer.\n\n¿Estas seguro?',
  },
  en: {
    title: 'Salary Path',
    subtitle: 'Salary projection and profile comparison',
    comparisonNav: 'Comparison',
    myPathNav: 'My Path',
    profileNav: 'Profile',
    companiesNav: 'Companies',
    settingsNav: 'Settings',
    profileTitle: 'Profile',
    profileSubtitle: 'Personal salary detail',
    myPathTitle: 'My Career Path',
    myPathSubtitle: 'Salary progression by company and growth comparison',
    people: 'People',
    companies: 'Companies',
    company: 'Company',
    companyPeriod: 'Period',
    compensationUnit: 'Compensation unit',
    hourlyUnit: 'Hourly',
    monthlyUnit: 'Monthly',
    comparisonMode: 'Comparison',
    metric: 'Metric',
    bonusMode: 'Bonuses',
    bonusesOff: 'No bonuses',
    bonusesOn: 'Include bonuses',
    language: 'Language',
    theme: 'Theme',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    lightMode: 'Light',
    darkMode: 'Dark',
    projection: 'Projection',
    projectionYears: 'Horizon (years)',
    projectionAnnualRaise: 'Annual raise (USD/h)',
    projectionActive: 'Projection enabled',
    projectionInactive: 'Projection disabled',
    projectionReset: 'Reset projection',
    calendarMode: 'Calendar',
    tenureMode: 'Tenure',
    rateMetric: 'Rate (USD/h)',
    incomeMetric: 'Accumulated income',
    pathMetricNormalizedRate: 'Normalized rate (USD/h)',
    pathMetricIncome: 'Accumulated income',
    kpiCurrentRate: 'Current rate',
    kpiAnnualSalary: 'Annual salary',
    kpiAnnualSalaryWithBonus: 'Annual salary + bonuses',
    kpiMonthlySalary: 'Monthly salary',
    kpiMonthlySalaryWithBonus: 'Monthly salary + bonuses',
    kpiTotalIncome: 'Total income',
    kpiTotalIncomeWithBonus: 'Total income + bonuses',
    kpiMarketGap: 'Gap to market',
    kpiTenure: 'Tenure',
    tablePerson: 'Person',
    tableRate: 'Current rate',
    tableRateAligned: 'Aligned rate',
    tableIncome: 'Total income',
    tableIncomeAligned: 'Aligned income',
    tableIncomeProjected: 'Projected income',
    tableGap: 'Gap',
    tableGapAligned: 'Aligned gap',
    tableGapProjected: 'Projected gap',
    tableTenure: 'Tenure',
    tableLastEvent: 'Last event',
    tableReferenceDate: 'Reference date',
    tableProjectionDate: 'Projected date',
    tableYear: 'Year',
    tableAnnualBase: 'Annual base',
    tableBonus: 'Bonuses',
    tableAnnualTotal: 'Annual total',
    tableMonthlyBase: 'Monthly base',
    tableMonthlyTotal: 'Monthly total',
    tableTenureHint: 'Comparison aligned by tenure',
    tableProjectionHint: 'Summary with projection applied',
    projectionBonusNote: 'Bonuses are excluded while projection is active.',
    tableRateProjected: 'Projected rate',
    startCompensation: 'Start compensation',
    endCompensation: 'End compensation',
    growthAbsolute: 'Growth (absolute)',
    growthPercent: 'Growth (%)',
    growthNormalizedHourly: 'Growth normalized (USD/h)',
    totalIncomeByCompany: 'Total income by company',
    personalScore: 'Personal score',
    normalization: 'Normalization',
    normalizationEstimated: 'Estimated',
    normalizationExact: 'Exact',
    monthlyHours: 'Hours/month',
    selectedUsers: 'Selected users',
    summary: 'Summary',
    drawerTitle: 'User detail',
    close: 'Close',
    startDate: 'Start date',
    careerEvents: 'Career events',
    eventType: 'Type',
    eventDate: 'Date',
    eventRate: 'Rate',
    openUserDetailHint: 'Click to view full user details',
    raiseEvent: 'Rate increase',
    effectiveDate: 'Effective from',
    futureInputTitle: 'Coming soon',
    futureInputBody: 'Use the management panel to create and edit your professional and financial history.',
    na: 'N/A',
    chartLegendTitle: 'Detail',
    pathChartLegendTitle: 'Path detail',
    years: 'years',
    days: 'days',
    perHour: '/h',
    perMonth: '/month',
    showManagement: 'Show management',
    hideManagement: 'Hide management',
    signOut: 'Sign out',
    wizardTitle: 'Welcome to Salary Path',
    wizardSubtitle: 'Set up your career profile to get started',
    wizardCurrentCompany: 'Current Company',
    wizardCompanyName: 'Company name',
    wizardCompanyNamePlaceholder: 'e.g. Acme Corp',
    wizardCompanyStartDate: 'Start date at this company',
    wizardCompensationType: 'Compensation type',
    wizardHourlyRate: 'Hourly rate',
    wizardMonthlySalary: 'Monthly salary',
    wizardInitialRate: 'when you joined',
    wizardCurrentRate: 'current',
    wizardCurrentRole: 'Current role (optional)',
    wizardCurrentRolePlaceholder: 'e.g. Software Engineer',
    wizardWorkSettings: 'Work Settings',
    wizardMonthlyHours: 'Monthly hours',
    wizardWorkingDays: 'Working days/year',
    wizardCurrency: 'Currency',
    wizardYourColor: 'Your Color',
    wizardHint: 'You can add previous companies and detailed career events later from the Companies tab.',
    wizardSubmit: 'Start my Career Path',
    wizardSubmitting: 'Setting up...',
    companiesTitle: 'Companies & Career Events',
    companiesSubtitle: 'Manage your professional timeline',
    companiesCol: 'Companies',
    eventsCol: 'Events',
    detailsCol: 'Details',
    addBtn: '+ Add',
    cancelBtn: 'Cancel',
    createBtn: 'Create',
    saveChanges: 'Save changes',
    deleteEvent: 'Delete event',
    deleteCompany: 'Delete company',
    noCompaniesYet: 'No companies yet',
    noEventsYet: 'No events yet',
    selectCompany: 'Select a company',
    selectEventHint: 'Select an event to see details, or select a company to edit it',
    companyNameLabel: 'Company name',
    colorLabel: 'Color',
    endDateLabel: 'End date',
    endDateHint: 'Leave empty for current company',
    scoreLabel: 'Personal score (0-10)',
    companyPeriodLabel: 'Company type',
    companyCurrentLabel: 'Current',
    companyPreviousLabel: 'Previous',
    initialCompensationLabel: 'Initial salary',
    compensationUnitWarning: 'Changing the unit will affect all salaries recorded for this company.',
    compensationUnitConfirm: 'Changing the unit will affect all salaries recorded for this company. Are you sure?',
    eventTypeLabel: 'Event type',
    dateLabel: 'Date',
    amountLabel: 'Amount',
    titleRoleLabel: 'Title / role',
    addEvent: 'Add event',
    present: 'present',
    evtStart: 'Start',
    evtRaise: 'Raise',
    evtAnnualRaise: 'Annual raise',
    evtMidYearRaise: 'Mid-year raise',
    evtPromotion: 'Promotion',
    evtCompanyChange: 'Company change',
    evtKnownCompensation: 'Known compensation',
    companyCreatedSuccess: 'Company created successfully.',
    companyCreatedError: 'Unable to create company.',
    companyUpdatedSuccess: 'Company updated successfully.',
    companyUpdatedError: 'Unable to update company.',
    companyDeletedSuccess: 'Company deleted successfully.',
    companyDeletedError: 'Unable to delete company.',
    eventCreatedSuccess: 'Event added successfully.',
    eventCreatedError: 'Unable to add event.',
    eventUpdatedSuccess: 'Event updated successfully.',
    eventUpdatedError: 'Unable to update event.',
    eventDeletedSuccess: 'Event deleted successfully.',
    eventDeletedError: 'Unable to delete event.',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage your account and data',
    settingsDataSection: 'Data Management',
    settingsResetTitle: 'Reset all data',
    settingsResetDescription: 'Permanently delete all your companies, career events, and settings. You will be redirected to the onboarding wizard to start fresh.',
    settingsResetButton: 'Delete all data & restart',
    settingsResetting: 'Deleting...',
    settingsResetConfirm: 'This will permanently delete ALL your data (companies, events, settings) and restart the onboarding wizard. This action cannot be undone.\n\nAre you sure?',
  },
};

const eventReasonMessages: Record<string, Record<UiLanguage, string>> = {
  start: {
    es: 'Inicio',
    en: 'Start',
  },
  annual_raise: {
    es: 'Aumento anual',
    en: 'Annual raise',
  },
  known_rate: {
    es: 'Tarifa conocida',
    en: 'Known rate',
  },
  known_compensation: {
    es: 'Compensacion conocida',
    en: 'Known compensation',
  },
  mid_year_raise: {
    es: 'Aumento de medio año',
    en: 'Mid-year raise',
  },
  promotion: {
    es: 'Promocion',
    en: 'Promotion',
  },
  raise: {
    es: 'Aumento',
    en: 'Raise',
  },
  company_change: {
    es: 'Cambio de empresa',
    en: 'Company change',
  },
};

export function t(language: UiLanguage, key: MessageKey): string {
  return messages[language][key];
}

export function getEventReasonLabel(type: string, language: UiLanguage): string {
  const localized = eventReasonMessages[type]?.[language];
  if (localized) {
    return localized;
  }

  const normalizedType = type.replace(/_/g, ' ').trim();
  if (normalizedType.length === 0) {
    return language === 'es' ? 'Evento' : 'Event';
  }

  return normalizedType[0].toUpperCase() + normalizedType.slice(1);
}

export function formatCurrency(value: number | null, language: UiLanguage): string {
  if (value === null) {
    return t(language, 'na');
  }

  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSignedCurrency(value: number, language: UiLanguage): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    signDisplay: 'always',
  }).format(value);
}

export function formatRate(value: number, language: UiLanguage): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatSignedRate(value: number, language: UiLanguage): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(value);
}

export function formatPercent(value: number, language: UiLanguage): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value)}%`;
}

export function formatTenure(days: number, language: UiLanguage): string {
  const years = days / 365;
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const yearValue = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(years);

  return `${yearValue} ${t(language, 'years')}`;
}

export function formatDateLabel(date: string, language: UiLanguage): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const value = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(value);
}
