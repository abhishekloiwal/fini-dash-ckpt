import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/polymet/layouts/dashboard-layout";
import { Home } from "@/polymet/pages/home";
import { Analytics } from "@/polymet/pages/analytics";
import { Deploy } from "@/polymet/pages/deploy";
import { KnowledgeDashboard } from "@/polymet/pages/knowledge-dashboard";
import { PromptConfigurator } from "@/polymet/pages/prompt-configurator";
import { AdditionalSettings } from "@/polymet/pages/additional-settings";
import { ExternalKnowledge } from "@/polymet/pages/external-knowledge";
import { Playground } from "@/polymet/pages/playground";
import { History } from "@/polymet/pages/history";
import { Test } from "@/polymet/pages/test";
import TestFromConversations from "@/polymet/pages/test-from-conversations";
import TestAddManually from "@/polymet/pages/test-add-manually";
import TestAiExpansion from "@/polymet/pages/test-ai-expansion";

export default function KnowledgeApp() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardLayout>
              <Home />
            </DashboardLayout>
          }
        />

        <Route
          path="/analytics"
          element={
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          }
        />

        <Route
          path="/deploy"
          element={
            <DashboardLayout>
              <Deploy />
            </DashboardLayout>
          }
        />

        <Route
          path="/knowledge-items"
          element={
            <DashboardLayout>
              <KnowledgeDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/prompt-configurator"
          element={
            <DashboardLayout>
              <PromptConfigurator />
            </DashboardLayout>
          }
        />

        <Route
          path="/additional-settings"
          element={
            <DashboardLayout>
              <AdditionalSettings />
            </DashboardLayout>
          }
        />

        <Route
          path="/external-knowledge"
          element={
            <DashboardLayout>
              <ExternalKnowledge />
            </DashboardLayout>
          }
        />

        <Route
          path="/playground"
          element={
            <DashboardLayout>
              <Playground />
            </DashboardLayout>
          }
        />

        <Route
          path="/history"
          element={
            <DashboardLayout>
              <History />
            </DashboardLayout>
          }
        />

        <Route
          path="/test"
          element={
            <DashboardLayout>
              <Test />
            </DashboardLayout>
          }
        />
        <Route
          path="/test/from-conversations"
          element={
            <DashboardLayout>
              <TestFromConversations />
            </DashboardLayout>
          }
        />
        <Route
          path="/test/add-manually"
          element={
            <DashboardLayout>
              <TestAddManually />
            </DashboardLayout>
          }
        />
        <Route
          path="/test/ai-expansion"
          element={
            <DashboardLayout>
              <TestAiExpansion />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}
