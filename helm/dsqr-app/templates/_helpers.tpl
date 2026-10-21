{{- define "dsqr-app.selectorLabels" -}}
app.kubernetes.io/name: dsqr-app
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{- define "dsqr-app.labels" -}}
{{ include "dsqr-app.selectorLabels" . }}
app.kubernetes.io/component: {{ .Values.application | quote }}
app.kubernetes.io/part-of: dsqr-dotdev
app.kubernetes.io/managed-by: {{ .Release.Service | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | quote }}
{{- end }}
