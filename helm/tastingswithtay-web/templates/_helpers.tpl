{{- define "tastingswithtay-web.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "tastingswithtay-web.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "tastingswithtay-web.name" . | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "tastingswithtay-web.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "tastingswithtay-web.labels" -}}
helm.sh/chart: {{ include "tastingswithtay-web.chart" . }}
app.kubernetes.io/name: {{ include "tastingswithtay-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "tastingswithtay-web.selectorLabels" -}}
app: {{ include "tastingswithtay-web.fullname" . }}
app.kubernetes.io/name: {{ include "tastingswithtay-web.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "tastingswithtay-web.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "tastingswithtay-web.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
