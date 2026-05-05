{{- define "dotdev-labs.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dotdev-labs.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "dotdev-labs.name" . | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "dotdev-labs.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dotdev-labs.labels" -}}
helm.sh/chart: {{ include "dotdev-labs.chart" . }}
app.kubernetes.io/name: {{ include "dotdev-labs.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "dotdev-labs.selectorLabels" -}}
app: {{ include "dotdev-labs.fullname" . }}
app.kubernetes.io/name: {{ include "dotdev-labs.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "dotdev-labs.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "dotdev-labs.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
