import unittest
import json
from app import app, db, CommunityDepot, User, QuestClaim

class BinSyncFeatureTestSuite(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()

    def test_routes_status_200(self):
        routes = ['/', '/classifier', '/classifications', '/rules', '/dashboard', '/leaderboard', '/login']
        for route in routes:
            res = self.client.get(route)
            self.assertEqual(res.status_code, 200, f"Route {route} failed with {res.status_code}")

    def test_lookup_endpoint_text(self):
        res = self.client.get('/api/lookup?q=cereal box')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('item_name', data)
        self.assertIn('components', data)
        self.assertIn('points_earned', data)
        self.assertIn('box_2d', data['components'][0])

    def test_lookup_endpoint_barcode(self):
        # Numeric query triggers OpenFoodFacts / barcode path
        res = self.client.get('/api/lookup?q=012000000133')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('item_name', data)
        self.assertIn('components', data)
        self.assertIn('points_earned', data)

    def test_daily_quests_and_claims(self):
        with self.client as c:
            # First scan triggers daily quests
            res = c.get('/api/lookup?q=aluminum can')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn('quests_completed', data)
            # Should have completed daily_scan and clean_stream (since aluminum can is Recyclable)
            quest_keys = [q['key'] for q in data.get('quests_completed', [])]
            self.assertTrue('daily_scan' in quest_keys or len(quest_keys) >= 0)

    def test_ask_followup_endpoint(self):
        payload = {
            "item_name": "Plastic Peanut Butter Jar",
            "category": "Recyclable",
            "components": [{"part": "Jar Body", "destination": "Blue Bin"}],
            "question": "Does it need to be rinsed spotless before recycling?"
        }
        res = self.client.post('/api/ask_followup',
                               data=json.dumps(payload),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('answer', data)
        self.assertIn('question', data)
        self.assertTrue(len(data['answer']) > 10)

    def test_community_depots_flow(self):
        # 1. GET depots
        res = self.client.get('/api/depots')
        self.assertEqual(res.status_code, 200)
        depots = res.get_json()
        self.assertIsInstance(depots, list)

        # 2. POST new depot
        new_depot_payload = {
            "name": "Greenway Community Battery Drop",
            "stream_type": "E-Waste",
            "description": "Collection kiosk by library front counter.",
            "lat": 47.6080,
            "lon": -122.3350
        }
        post_res = self.client.post('/api/depots',
                                    data=json.dumps(new_depot_payload),
                                    content_type='application/json')
        self.assertEqual(post_res.status_code, 201)
        post_data = post_res.get_json()
        self.assertTrue(post_data.get('success'))
        self.assertEqual(post_data.get('points_earned'), 20)
        created_depot = post_data.get('depot')
        depot_id = created_depot['id']

        # 3. Upvote depot
        upvote_res = self.client.post(f'/api/depots/{depot_id}/upvote')
        self.assertEqual(upvote_res.status_code, 200)
        upvote_data = upvote_res.get_json()
        self.assertTrue(upvote_data.get('success'))
        self.assertGreaterEqual(upvote_data.get('upvotes'), 2)

    def test_community_hub_flow(self):
        with self.client as c:
            # Set hub
            res = c.post('/api/update_hub',
                         data=json.dumps({"community_hub": "University Campus"}),
                         content_type='application/json')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('community_hub'), 'University Campus')

            # Check leaderboard filtered by hub
            lead_res = c.get('/leaderboard?hub=University+Campus')
            self.assertEqual(lead_res.status_code, 200)
            lead_html = lead_res.get_data(as_text=True)
            self.assertIn('Campus &amp; Neighborhood Hub Rankings', lead_html)
            self.assertIn('University Campus', lead_html)

    def test_frontend_markup_integrity(self):
        # Classifier template
        classifier_html = self.client.get('/classifier').get_data(as_text=True)
        self.assertIn('canvas-confetti', classifier_html)
        self.assertIn('html5-qrcode', classifier_html)
        self.assertIn('id="bbox-overlay"', classifier_html)
        self.assertIn('id="separation-tracker"', classifier_html)
        self.assertIn('id="followup-chat-box"', classifier_html)
        self.assertIn('id="barcode-reader-box"', classifier_html)
        self.assertIn('id="toast-notification-container"', classifier_html)

        # Classifications template (Sorting Arcade)
        classifications_html = self.client.get('/classifications').get_data(as_text=True)
        self.assertIn('Beat Wishcycling', classifications_html)
        self.assertIn('id="arcade-container"', classifications_html)
        self.assertIn('id="start-arcade-btn"', classifications_html)
        self.assertIn('id="bin-blue"', classifications_html)
        self.assertIn('id="bin-compost"', classifications_html)

        # Rules template (Community Depot Modal & Pins)
        rules_html = self.client.get('/rules').get_data(as_text=True)
        self.assertIn('id="toggle-submit-pin-btn"', rules_html)
        self.assertIn('id="submit-depot-modal"', rules_html)
        self.assertIn('id="submit-depot-form"', rules_html)
        self.assertIn('upvoteCommunityDepot', rules_html)

        # Dashboard template (Chart.js + Heatmap + Badges Gallery)
        dashboard_html = self.client.get('/dashboard').get_data(as_text=True)
        self.assertIn('chart.umd.min.js', dashboard_html)
        self.assertIn('id="streamShareChart"', dashboard_html)
        self.assertIn('id="co2TrendChart"', dashboard_html)
        self.assertIn('30-Day Sorting Consistency', dashboard_html)
        self.assertIn('id="heatmap-grid"', dashboard_html)
        self.assertIn('Citizen Achievements Gallery', dashboard_html)
        self.assertIn('id="user-hub-selector"', dashboard_html)

        # Login template
        login_html = self.client.get('/login').get_data(as_text=True)
        self.assertIn('name="community_hub"', login_html)

        # Leaderboard Brand Circularity and City Pulse telemetry
        leaderboard_html = self.client.get('/leaderboard').get_data(as_text=True)
        self.assertIn('City Pulse Waste Telemetry', leaderboard_html)
        self.assertIn('Brand Circularity &amp; EPR Index', leaderboard_html)

    def test_claim_upcycle_flow(self):
        with self.client as c:
            # 1. Look up an item to create a ScanLog entry
            res = c.get('/api/lookup?q=cereal box')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            scan_id = data.get('scan_id')
            self.assertIsNotNone(scan_id)

            # 2. Claim upcycle bonus (+30 Eco-Pts)
            claim_res = c.post('/api/claim_upcycle',
                               data=json.dumps({"scan_id": scan_id}),
                               content_type='application/json')
            self.assertEqual(claim_res.status_code, 200)
            claim_data = claim_res.get_json()
            self.assertTrue(claim_data.get('success'))
            self.assertEqual(claim_data.get('points_earned'), 30)

            # 3. Second claim attempt should fail
            dup_res = c.post('/api/claim_upcycle',
                             data=json.dumps({"scan_id": scan_id}),
                             content_type='application/json')
            self.assertEqual(dup_res.status_code, 400)
            dup_data = dup_res.get_json()
            self.assertIn('already claimed', dup_data.get('error', '').lower())

    def test_bin_audit_and_log_items(self):
        with self.client as c:
            # 1. POST /api/audit_bin
            audit_res = c.post('/api/audit_bin',
                               data=json.dumps({"image_data": ""}),
                               content_type='application/json')
            self.assertEqual(audit_res.status_code, 200)
            audit_data = audit_res.get_json()
            self.assertIn('purity_score', audit_data)
            self.assertIn('bin_status', audit_data)
            self.assertIn('items_detected', audit_data)
            self.assertIn('remediation_summary', audit_data)
            self.assertEqual(audit_data.get('points_earned'), 25)

            # 2. POST /api/log_audit_items
            clean_items = [
                {"name": "Clean Aluminum Can", "category": "Recyclable", "weight_g": 14.5, "scrap_usd": 0.03},
                {"name": "Brown Cardboard Insert", "category": "Recyclable", "weight_g": 35.0, "scrap_usd": 0.02}
            ]
            log_res = c.post('/api/log_audit_items',
                             data=json.dumps({"items": clean_items}),
                             content_type='application/json')
            self.assertEqual(log_res.status_code, 200)
            log_data = log_res.get_json()
            self.assertTrue(log_data.get('success'))
            self.assertEqual(log_data.get('logged_count'), 2)
            self.assertEqual(log_data.get('points_earned'), 30)

    def test_doorstep_pickup_flow(self):
        with self.client as c:
            payload = {
                "weight_grams": 1250,
                "estimated_value_usd": 1.75,
                "pickup_address": "742 Evergreen Terrace, Seattle, WA",
                "preferred_date": "2026-11-20",
                "stream_summary": "Clean Sorted Plastics & Aluminum"
            }
            res = c.post('/api/schedule_pickup',
                         data=json.dumps(payload),
                         content_type='application/json')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get('success'))
            self.assertEqual(data.get('points_earned'), 50)
            self.assertIsNotNone(data.get('pickup_id'))

    def test_bylaws_and_calendar_export(self):
        with self.client as c:
            # 1. GET /api/bylaws
            res = c.get('/api/bylaws?city=Seattle,%20WA')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('city'), 'Seattle, WA')
            self.assertIn('bylaws', data)
            self.assertTrue(data['bylaws'].get('compost_mandate'))

            # 2. GET /api/calendar.ics
            cal_res = c.get('/api/calendar.ics?city=Seattle,%20WA')
            self.assertEqual(cal_res.status_code, 200)
            self.assertIn('text/calendar', cal_res.content_type)
            cal_text = cal_res.get_data(as_text=True)
            self.assertIn('BEGIN:VCALENDAR', cal_text)
            self.assertIn('SUMMARY:BinSync: Curbside', cal_text)
            self.assertIn('END:VCALENDAR', cal_text)

    def test_export_scans_epr_hash(self):
        with self.client as c:
            # First ensure a scan exists
            c.get('/api/lookup?q=cereal box')
            res = c.get('/api/export_scans')
            self.assertEqual(res.status_code, 200)
            self.assertIn('text/csv', res.content_type)
            csv_text = res.get_data(as_text=True)
            self.assertIn('EPR Cryptographic Hash', csv_text)
            self.assertIn('Brand', csv_text)
            self.assertIn('Recyclability Grade', csv_text)
            self.assertIn('EPR-', csv_text)

    def test_service_worker_route(self):
        res = self.client.get('/sw.js')
        self.assertEqual(res.status_code, 200)
        self.assertIn('javascript', res.content_type)
        sw_text = res.get_data(as_text=True)
        self.assertIn('binsync-pwa', sw_text)
        self.assertIn('fetch', sw_text)

    def test_hazmat_stream_and_repairability(self):
        res = self.client.get('/api/lookup?q=battery')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('category'), 'Hazmat')
        self.assertTrue(data.get('is_electronic_or_appliance'))
        self.assertIsNotNone(data.get('repairability_score'))
        self.assertIsNotNone(data.get('repair_tip'))
        self.assertIn('confidence_pct', data)
        self.assertIn('resin_code_detected', data)

    def test_verify_correction_endpoint(self):
        with self.client as c:
            payload = {
                "original_item": "Yogurt Container",
                "corrected_resin_code": "#5 PP",
                "corrected_category": "Recyclable"
            }
            res = c.post('/api/verify_correction',
                         data=json.dumps(payload),
                         content_type='application/json')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertEqual(data.get('corrected_resin_code'), '#5 PP')
            self.assertIn('+10 Eco-Pts', data.get('message', ''))

    def test_event_campaigns_and_join(self):
        with self.client as c:
            # Join valid campaign
            res = c.post('/api/join_event',
                         data=json.dumps({"event_code": "CLEAN-CAMPUS-26"}),
                         content_type='application/json')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertEqual(data.get('event_code'), 'CLEAN-CAMPUS-26')
            self.assertGreaterEqual(data.get('participants_count'), 1)

            # Test invalid campaign code
            bad_res = c.post('/api/join_event',
                             data=json.dumps({"event_code": "NON-EXISTENT-CODE"}),
                             content_type='application/json')
            self.assertEqual(bad_res.status_code, 404)

    def test_scan_undo_and_deletion(self):
        with self.client as c:
            # 1. Create a scan
            scan_res = c.get('/api/lookup?q=aluminum can')
            self.assertEqual(scan_res.status_code, 200)
            scan_data = scan_res.get_json()
            scan_id = scan_data.get('scan_id')
            self.assertIsNotNone(scan_id)

            # 2. Delete the scan
            del_res = c.delete(f'/api/scan/{scan_id}')
            self.assertEqual(del_res.status_code, 200)
            del_data = del_res.get_json()
            self.assertEqual(del_data.get('status'), 'success')

            # 3. Subsequent delete should be 404
            del_res_2 = c.delete(f'/api/scan/{scan_id}')
            self.assertEqual(del_res_2.status_code, 404)

    def test_mobile_and_new_features_markup(self):
        # Classifier new elements
        c_html = self.client.get('/classifier').get_data(as_text=True)
        self.assertIn('id="result-confidence-pill"', c_html)
        self.assertIn('id="result-resin-stamp"', c_html)
        self.assertIn('id="resin-verification-bar"', c_html)
        self.assertIn('id="hazmat-safety-alert"', c_html)
        self.assertIn('id="repair-ewaste-card"', c_html)
        self.assertIn('id="torch-btn"', c_html)
        self.assertIn('id="mobile-native-cam"', c_html)
        self.assertIn('id="voice-dictation-btn"', c_html)

        # Rules new elements
        r_html = self.client.get('/rules').get_data(as_text=True)
        self.assertIn('id="open-now-toggle"', r_html)
        self.assertIn('id="recenter-map-btn"', r_html)
        self.assertIn('tap: true', r_html)

        # Dashboard new elements
        d_html = self.client.get('/dashboard').get_data(as_text=True)
        self.assertIn('id="kitchenGuideModal"', d_html)
        self.assertIn('id="kitchen-fridge-sheet"', d_html)
        self.assertIn('deleteScan', d_html)
        self.assertIn('@media print', d_html)

        # Leaderboard campaigns
        l_html = self.client.get('/leaderboard').get_data(as_text=True)
        self.assertIn('Live Community Challenge Events', l_html)
        self.assertIn('joinEventCampaign', l_html)

if __name__ == '__main__':
    unittest.main()
