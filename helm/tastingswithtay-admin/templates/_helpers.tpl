{{- define "tastingswithtay-admin.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "tastingswithtay-admin.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "tastingswithtay-admin.name" . | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "tastingswithtay-admin.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "tastingswithtay-admin.labels" -}}
helm.sh/chart: {{ include "tastingswithtay-admin.chart" . }}
app.kubernetes.io/name: {{ include "tastingswithtay-admin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "tastingswithtay-admin.selectorLabels" -}}
app: {{ include "tastingswithtay-admin.fullname" . }}
app.kubernetes.io/name: {{ include "tastingswithtay-admin.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "tastingswithtay-admin.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "tastingswithtay-admin.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
